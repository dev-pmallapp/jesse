import {
  Ht,
  Kt,
  b as b_1,
  g as g_1,
  it,
  mt,
  vn,
  xn,
  xt,
  y as y_1,
} from "./CoKk4mC0.js";
import { ct } from "./Cd-sGgPF.js";
import { t as t_1 } from "./HclGiUj8.js";
const __vite__mapDeps = (
  i,
  m = __vite__mapDeps,
  d = m.f ||
    (m.f = [
      "./CUP8soDG.js",
      "./QTnfLwEv.js",
      "./HclGiUj8.js",
      "./Czk_mF82.js",
      "./editor.DNwT-hdg.css",
      "./HlOV9je9.js",
      "./toggleHighContrast.DUMOsFrl.css",
      "./B2-f6Wu2.js",
    ]),
) => i.map((i) => d[i]);
let f = null;
function p() {
  f ||= (async () => {
    if (!self.MonacoEnvironment) {
      self.MonacoEnvironment = {};
    }
    if (!self.MonacoEnvironment.getWorker) {
      self.MonacoEnvironment.getWorker = (e, t) => {
        let n = (e) =>
          new URL(
            `${useNuxtApp().$config.app.baseURL}/_nuxt/nuxt-monaco-editor/vs/${e}.js`.replace(
              /\/\//g,
              `/`,
            ),
            import.meta.url,
          );
        let r =
          {
            json: `language/json/json.worker`,
            css: `language/css/css.worker`,
            html: `language/html/html.worker`,
            typescript: `language/typescript/ts.worker`,
            javascript: `language/typescript/ts.worker`,
          }[t] || `editor/editor.worker`;
        return new Worker(n(r), {
          type: `module`,
        });
      };
    }
    return await t_1(
      () => import(`./CUP8soDG.js`).then((e) => e.t),
      __vite__mapDeps([0, 1, 2, 3, 4, 5, 6, 7]),
      import.meta.url,
    );
  })();
  return f;
}
export const t = {
  __name: `MonacoEditor`,
  props: {
    lang: {
      type: String,
      required: false,
      default: () => `plaintext`,
    },
    options: {
      type: null,
      required: false,
      default: () => ({}),
    },
    modelUri: {
      type: null,
      required: false,
    },
    modelValue: {
      type: String,
      required: false,
      default: () => ``,
    },
  },
  emits: [`update:modelValue`, `load`],
  async setup(d, { expose, emit }) {
    let h;
    let g;
    let _ = d;
    let v = emit;
    let y = vn(true);
    let b = g_1(() => _.lang || _.options.language);
    let x = xn();
    let S = vn();
    let C = {
      automaticLayout: true,
    };
    expose({
      $editor: x,
    });
    [h, g] = Kt(() => p());
    h = await h;
    g();
    let w = h;
    let T;
    let E;
    Ht(
      () => _.modelValue,
      () => {
        T?.getValue() !== _.modelValue && T?.setValue(_.modelValue);
      },
    );
    Ht(
      () => [_.lang, _.modelUri],
      () => {
        if (E) {
          E.dispose();
        }
        E = w.editor.createModel(_.modelValue, b.value, _.modelUri);
        T?.setModel(E);
      },
    );
    Ht(
      () => _.options,
      () => {
        T?.updateOptions(ct(_.options, C));
      },
    );
    Ht(S, (e, t) => {
      if (!(!S.value || t)) {
        T = w.editor.create(S.value, ct(_.options, C));
        E = w.editor.createModel(_.modelValue, b.value, _.modelUri);
        x.value = T;
        T.layout();
        T.setModel(E);
        T.onDidChangeModelContent(() => {
          v(`update:modelValue`, T.getValue());
        });
        y.value = false;
        v(`load`, T);
      }
    });
    it(() => {
      T?.dispose();
      E?.dispose();
    });
    return (e, t) => {
      mt();
      return b_1(
        `div`,
        {
          ref_key: `editorElement`,
          ref: S,
        },
        [
          y.value
            ? xt(e.$slots, `default`, {}, undefined, undefined, 0)
            : y_1(``, true),
        ],
        512,
      );
    };
  },
};
