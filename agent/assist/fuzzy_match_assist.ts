export namespace str_fuzzy {

    export function match(mainstr: string, needstr: string) {
        const pateern = `^${needstr.replaceAll("*", ".*")}$`;
        const fuzzy_reg = new RegExp(pateern, "i");

        return fuzzy_reg.test(mainstr);
    }

}