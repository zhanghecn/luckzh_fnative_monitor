import { AndroidLinker } from '../native/unix_android';
import { str_fuzzy } from './fuzzy_match_assist';
export const alinker = new AndroidLinker()
export namespace module_help {

    export function watchModule(callback: (path: string) => void) {
        alinker.hook_do_dlopen(callback);
    }

    export function toModuleNames(modules: Module[]) {
        return modules.map(m => m.name);
    }
    export function nagationModules(mm: ModuleMap, path: string | null, name: string | null) {
        // console.log("path:" + path, "name:" + name);
        const ms = mm.values()
            .filter(m => {
                if (path == null) return true;
                return !str_fuzzy.match(m.path, path);
            }).filter(m => {
                if (name == null) return true;
                return !str_fuzzy.match(m.name, name);
            });
        const check_m_names = mm.values()
            .filter(m => {
                if (path == null) return true;
                return str_fuzzy.match(m.path, path);
            }).filter(m => {
                if (name == null) return true;
                return str_fuzzy.match(m.name, name);
            })
            .map(m => m.name)
            .reduce((previous, cur, i, array) => {
                previous.add(cur)
                return previous;
            }, new Set<string>());
        ;
        const excludes = mm.values()
            .filter(m => {
                return !check_m_names.has(m.name);
            });
        // console.log("check_m_names:",check_m_names)

        return excludes;
    }

}