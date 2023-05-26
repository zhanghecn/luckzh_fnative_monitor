import { AndroidLinker } from '../native/unix_android';
import { str_fuzzy } from './fuzzy_match_assist';
const al = new AndroidLinker()
export namespace module_help {

    export function watchModule(callback: (path: string) => void) {
        al.hook_do_dlopen(callback);
    }

    export function nagationModules(mm: ModuleMap, path: string | null, name: string | null) {
        mm.update();
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
            ;

        console.log("check_m_names:",check_m_names)

        return ms;
    }

}