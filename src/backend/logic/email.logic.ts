import { Employee } from "../model/employee.interface";

export type EmailMatcher = (email1: string, email2: string) => boolean;

export const IgnoreDomain: EmailMatcher = (email1: string, email2: string): boolean => {
    const leftHandEmail1 = email1.split("@")[0];
    const leftHandEmail2 = email2.split("@")[0];

    return leftHandEmail1 === leftHandEmail2;
}

export class EmailMap<T> extends Map<string, T> {

    constructor(private matcher: EmailMatcher) {
        super();
    }

    override has(key: string): boolean {

        for (const iterator of this) {
            if (this.matcher(key, iterator[0])) {
                return true;
            }
        }

        return false;
    }

    override get(key: string): T | undefined {
        for (const iterator of this) {
            if (this.matcher(key, iterator[0])) {
                return iterator[1];
            }
        }

        return undefined;
    }

    override set(key: string, value: T): this {
        for (const iterator of this) {
            if (this.matcher(key, iterator[0])) {
                super.set(iterator[0], value);
                return this;
            }
        }

        super.set(key, value);

        return this;
    }
}

export class EmailSet extends Set<string> {
    constructor(private matcher: EmailMatcher) {
        super();
    }

    override has(key: string): boolean {

        for (const iterator of this) {
            if (this.matcher(key, iterator)) {
                return true;
            }
        }

        return false;
    }

    override add(key: string): this {
        for (const iterator of this) {
            if (this.matcher(key, iterator)) {
                return this;
            }
        }

        super.add(key);

        return this;
    }
}