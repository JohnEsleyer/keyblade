package main

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha1"
	"encoding/base32"
	"encoding/base64"
	"encoding/binary"
	"encoding/json"
	"fmt"
	"image"
	_ "image/jpeg"
	_ "image/png"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/makiuchi-d/gozxing"
	gozxingqr "github.com/makiuchi-d/gozxing/qrcode"
	skip2qr "github.com/skip2/go-qrcode"
)

type Account struct {
	ID        string `json:"id"`
	Issuer    string `json:"issuer"`
	Account   string `json:"account"`
	Secret    string `json:"secret"`
	CreatedAt int64  `json:"created_at"`
}

type AccountView struct {
	Account
	CurrentCode string `json:"current_code"`
	SecondsLeft int    `json:"seconds_left"`
}

type App struct {
	ctx       context.Context
	mu        sync.Mutex
	accounts  []Account
	storePath string
}

func NewApp() *App {
	dir, err := os.UserConfigDir()
	if err != nil {
		dir = "."
	}
	appDir := filepath.Join(dir, "Keyblade")
	_ = os.MkdirAll(appDir, 0755)

	app := &App{
		storePath: filepath.Join(appDir, "vault.json"),
		accounts:  []Account{},
	}
	app.loadAccounts()
	return app
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

func (a *App) loadAccounts() {
	data, err := os.ReadFile(a.storePath)
	if err == nil {
		_ = json.Unmarshal(data, &a.accounts)
	}
}

// saveAccounts persists the vault. Caller must hold a.mu.
func (a *App) saveAccounts() error {
	data, err := json.MarshalIndent(a.accounts, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(a.storePath, data, 0600)
}

// calculateTOTP implements RFC 6238 (HMAC-SHA1, 6 digits, 30s step).
func calculateTOTP(secret string, t time.Time) (string, int, error) {
	cleanSecret := strings.ToUpper(strings.ReplaceAll(strings.TrimSpace(secret), " ", ""))
	key, err := base32.StdEncoding.WithPadding(base32.NoPadding).DecodeString(cleanSecret)
	if err != nil {
		return "", 0, fmt.Errorf("invalid base32 secret")
	}

	epoch := t.Unix()
	step := int64(30)
	counter := uint64(epoch / step)
	secondsLeft := int(step - (epoch % step))

	buf := make([]byte, 8)
	binary.BigEndian.PutUint64(buf, counter)

	mac := hmac.New(sha1.New, key)
	mac.Write(buf)
	h := mac.Sum(nil)

	offset := h[len(h)-1] & 0x0f
	code := binary.BigEndian.Uint32(h[offset:offset+4]) & 0x7fffffff
	token := fmt.Sprintf("%06d", code%1000000)

	return token, secondsLeft, nil
}

// GetAccounts returns all accounts with freshly generated TOTPs.
func (a *App) GetAccounts() []AccountView {
	a.mu.Lock()
	defer a.mu.Unlock()

	now := time.Now()
	list := make([]AccountView, 0, len(a.accounts))
	for _, acc := range a.accounts {
		code, rem, err := calculateTOTP(acc.Secret, now)
		if err != nil {
			code = "ERR0R!"
		}
		list = append(list, AccountView{
			Account:     acc,
			CurrentCode: code,
			SecondsLeft: rem,
		})
	}
	return list
}

// AddAccount adds a manual entry.
func (a *App) AddAccount(issuer, account, secret string) (*Account, error) {
	a.mu.Lock()
	defer a.mu.Unlock()

	cleanSecret := strings.ToUpper(strings.ReplaceAll(strings.TrimSpace(secret), " ", ""))
	if _, err := base32.StdEncoding.WithPadding(base32.NoPadding).DecodeString(cleanSecret); err != nil {
		return nil, fmt.Errorf("invalid Base32 secret key")
	}

	item := Account{
		ID:        fmt.Sprintf("%d", time.Now().UnixNano()),
		Issuer:    strings.TrimSpace(issuer),
		Account:   strings.TrimSpace(account),
		Secret:    cleanSecret,
		CreatedAt: time.Now().Unix(),
	}

	a.accounts = append(a.accounts, item)
	_ = a.saveAccounts()
	return &item, nil
}

// ParseQRFromBase64 decodes an uploaded image and extracts an otpauth URI.
func (a *App) ParseQRFromBase64(base64Data string) (*Account, error) {
	parts := strings.SplitN(base64Data, ",", 2)
	raw := base64Data
	if len(parts) == 2 {
		raw = parts[1]
	}

	dec, err := base64.StdEncoding.DecodeString(raw)
	if err != nil {
		return nil, fmt.Errorf("failed to decode image data")
	}

	img, _, err := image.Decode(bytes.NewReader(dec))
	if err != nil {
		return nil, fmt.Errorf("unsupported image format")
	}

	bmp, err := gozxing.NewBinaryBitmapFromImage(img)
	if err != nil {
		return nil, fmt.Errorf("failed to process image bitmap")
	}

	qrReader := gozxingqr.NewQRCodeReader()
	res, err := qrReader.Decode(bmp, nil)
	if err != nil {
		return nil, fmt.Errorf("no valid QR code detected")
	}

	u, err := url.Parse(strings.TrimSpace(res.GetText()))
	if err != nil || u.Scheme != "otpauth" || u.Host != "totp" {
		return nil, fmt.Errorf("invalid OTP QR format")
	}

	q := u.Query()
	secret := q.Get("secret")
	if secret == "" {
		return nil, fmt.Errorf("secret not found in QR")
	}

	label := strings.TrimPrefix(u.Path, "/")
	issuer := q.Get("issuer")
	accountName := label

	if strings.Contains(label, ":") {
		split := strings.SplitN(label, ":", 2)
		if issuer == "" {
			issuer = split[0]
		}
		accountName = strings.TrimSpace(split[1])
	}
	if issuer == "" {
		issuer = "Unknown"
	}
	if accountName == "" {
		accountName = issuer
	}

	return a.AddAccount(issuer, accountName, secret)
}

// GetAccountQRCodeBase64 generates a QR image for an account.
func (a *App) GetAccountQRCodeBase64(id string) (string, error) {
	a.mu.Lock()
	var target *Account
	for i := range a.accounts {
		if a.accounts[i].ID == id {
			cp := a.accounts[i]
			target = &cp
			break
		}
	}
	a.mu.Unlock()

	if target == nil {
		return "", fmt.Errorf("account not found")
	}

	uri := fmt.Sprintf("otpauth://totp/%s:%s?secret=%s&issuer=%s",
		url.PathEscape(target.Issuer),
		url.PathEscape(target.Account),
		target.Secret,
		url.QueryEscape(target.Issuer),
	)

	pngBytes, err := skip2qr.Encode(uri, skip2qr.Medium, 256)
	if err != nil {
		return "", err
	}

	return "data:image/png;base64," + base64.StdEncoding.EncodeToString(pngBytes), nil
}

// DeleteAccount removes an account.
func (a *App) DeleteAccount(id string) bool {
	a.mu.Lock()
	defer a.mu.Unlock()

	for i, acc := range a.accounts {
		if acc.ID == id {
			a.accounts = append(a.accounts[:i], a.accounts[i+1:]...)
			_ = a.saveAccounts()
			return true
		}
	}
	return false
}
