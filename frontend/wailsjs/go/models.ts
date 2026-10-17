export namespace main {
	
	export class Account {
	    id: string;
	    issuer: string;
	    account: string;
	    secret: string;
	    created_at: number;
	
	    static createFrom(source: any = {}) {
	        return new Account(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.issuer = source["issuer"];
	        this.account = source["account"];
	        this.secret = source["secret"];
	        this.created_at = source["created_at"];
	    }
	}
	export class AccountView {
	    id: string;
	    issuer: string;
	    account: string;
	    secret: string;
	    created_at: number;
	    current_code: string;
	    seconds_left: number;
	
	    static createFrom(source: any = {}) {
	        return new AccountView(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.issuer = source["issuer"];
	        this.account = source["account"];
	        this.secret = source["secret"];
	        this.created_at = source["created_at"];
	        this.current_code = source["current_code"];
	        this.seconds_left = source["seconds_left"];
	    }
	}

}

