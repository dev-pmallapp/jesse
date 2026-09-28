import { r } from "./QTnfLwEv.js";
import { o } from "./DytYwiiF.js";
import {
  D as D_1,
  E as E_1,
  Ht,
  On,
  _ as __1,
  b as b_1,
  ct,
  ft,
  g,
  k,
  mt,
  nr,
  o as o_2,
  qt,
  tt,
  un,
  vn,
} from "./CoKk4mC0.js";
import { Jt, ot, st } from "./Cd-sGgPF.js";
import { t as t_1 } from "./2k_QeT3T.js";
import { E as E_2, O, f, t as t_2, w } from "./B8_r5oP7.js";
import { o as o_3, s } from "./CioJR-lb.js";
import { r as r_2 } from "./BpBaBBm3.js";
import { f as f_2, p } from "./Czk_mF82.js";
import "./CUP8soDG.js";
import { t as t_3 } from "./atteXEGs.js";
import { t as t_4 } from "./OaeI3Ulg.js";
import { t as t_5 } from "./CJNUlr67.js";
import { t as t_6 } from "./BG8CfSEZ2.js";
import { t as t_7 } from "./D1yN6wZY2.js";
import { t as t_8 } from "./C5kJGiKi2.js";
import { t as t_9 } from "./Cuy4t56v.js";
import { t as t_10 } from "./KhqzbbC32.js";
const P = r(E_2(), 1);
function F() {
  let { $connectPyrightLsp } = o();
  function n(e, t, n) {
    let r = f_2.parse(`file:///${t}`);
    let i = p.getModel(r);
    if (i) {
      i.setValue(n.value);
    } else {
      i = p.createModel(n.value, `python`, r);
    }
    e.getModel()?.dispose();
    e.setModel(i);
    i.onDidChangeContent(() => {
      n.value = i.getValue();
    });
    return i;
  }
  return {
    onEditorLoaded: async (t, r, i, a, o) => {
      let s = await t_8().getStrategy(r);
      a.value = s;
      n(t, i, a);
      if (o) {
        t.updateOptions(o);
      }
      $connectPyrightLsp(t);
      return s;
    },
  };
}
const I = s(t_9);
const L = {
  class: `flex-1 grid items-stretch lg:grid-cols-5 h-full overflow-hidden min-h-0`,
};
const R = {
  class: `flex flex-col lg:col-span-4 bg-backdrop dark:bg-backdrop-dark overflow-hidden min-h-0`,
};
const z = {
  class: `flex flex-col h-full w-full`,
};
const B = {
  class: `h-10 shrink-0 flex items-center justify-between px-4`,
};
const V = {
  class: `font-semibold`,
};
const H = {
  class: `flex items-center select-none`,
};
const U = {
  class: `flex-1 overflow-hidden border-l border-t dark:border-gray-600`,
};
const se = {
  class: `flex justify-end gap-2`,
};
const W = k({
  __name: `[name]`,
  setup(e) {
    let t = vn(false);
    let d = vn(false);
    let b = vn(``);
    let T = vn();
    let E = g(() => ot().params.name);
    let D = t_8();
    let M = vn(``);
    let W = vn(``);
    let G = f();
    let K = g(() => {
      if (G.value === `light`) {
        return `vs-light`;
      }
      return `vs-dark`;
    });
    let q = vn();
    let { onEditorLoaded } = F();
    r_2({
      title: `${E.value} - Jesse`,
    });
    Ht(
      E,
      (e) => {
        D.rememberStrategy(e);
      },
      {
        immediate: true,
      },
    );
    Ht(K, (theme) => {
      q.value.$editor.updateOptions({
        theme,
      });
    });
    async function onLoad(e) {
      let t = `strategies/${E.value}/__init__.py`;
      let n = await onEditorLoaded(e, E.value, t, M, {
        theme: K.value,
      });
      W.value = n;
    }
    ct(async () => {
      window.addEventListener(`keydown`, Q);
    });
    ft(() => {
      window.removeEventListener(`keydown`, Q);
    });
    let Y = g(() => M.value !== W.value);
    let X = g(() => t_2().settings.editor);
    let options = {
      automaticLayout: true,
      minimap: {
        enabled: X.value.minimap,
      },
      fontSize: X.value.fontSize,
      padding: {
        top: 16,
        bottom: 16,
      },
      cursorStyle: X.value.cursorStyle,
      cursorWidth: X.value.cursorWidth,
      lineHeight: X.value.lineHeight,
      cursorBlinking: X.value.cursorBlinking,
      renderLineHighlight: X.value.renderLineHighlight,
    };
    Ht(
      X,
      (e) => {
        q.value.$editor.updateOptions({
          minimap: {
            enabled: e.minimap,
          },
          fontSize: e.fontSize,
          cursorStyle: e.cursorStyle,
          cursorWidth: e.cursorWidth,
          lineHeight: e.lineHeight,
          cursorBlinking: e.cursorBlinking,
          renderLineHighlight: e.renderLineHighlight,
        });
      },
      {
        deep: true,
      },
    );
    function ue() {
      w.copyToClipboard(M.value);
      O(`success`, `Code copied to clipboard`);
    }
    async function Z() {
      if (Y.value) {
        if (M.value === ``) {
          O(`error`, `Code cannot be empty`);
          return;
        }
        await D.saveStrategy(E.value, M.value);
        W.value = M.value;
      }
    }
    let de = P.debounce(async () => {
      await Z();
    }, 300);
    function Q(e) {
      if (
        e.key === `s` &&
        (navigator.platform.match(`Mac`) ? e.metaKey : e.ctrlKey)
      ) {
        e.preventDefault();
        de();
      }
    }
    function fe() {
      q.value.$editor.trigger(`source`, `actions.find`, {});
    }
    function pe() {
      b.value = E.value;
      d.value = true;
      tt(() => {
        T.value?.$el?.querySelector(`input`)?.focus();
      });
    }
    async function $() {
      let e = b.value.trim();
      if (e && (await D.forkStrategy(e, M.value))) {
        await D.getStrategies();
        d.value = false;
        st().push(`/strategies/${e}`);
      }
    }
    function me() {
      D.deleteStrategy(E.value);
      st().push(`/strategies`);
    }
    return (e, i) => {
      let c = t_10;
      let l = t_5;
      let u = I;
      let m = o_3;
      let g = t_1;
      let _ = t_6;
      let v = t_7;
      let x = t_4;
      let S = t_3;
      mt();
      return b_1(
        o_2,
        null,
        [
          __1(`section`, L, [
            D_1(c),
            __1(`div`, R, [
              D_1(m, null, {
                default: qt(() => [
                  __1(`div`, z, [
                    __1(`div`, B, [
                      __1(`h2`, V, nr(On(E)), 1),
                      __1(`div`, H, [
                        D_1(
                          l,
                          {
                            size: `xs`,
                            icon: `i-heroicons-trash`,
                            color: `neutral`,
                            variant: `ghost`,
                            class: `ml-2`,
                            onClick: (i[0] ||= (e) => (t.value = true)),
                          },
                          {
                            default: qt(() => [
                              ...(i[6] ||= [E_1(` Delete `, -1)]),
                            ]),
                            _: 1,
                          },
                        ),
                        D_1(
                          l,
                          {
                            size: `xs`,
                            icon: `i-heroicons-clipboard`,
                            color: `neutral`,
                            variant: `ghost`,
                            class: `ml-2`,
                            onClick: ue,
                          },
                          {
                            default: qt(() => [
                              ...(i[7] ||= [E_1(` Copy `, -1)]),
                            ]),
                            _: 1,
                          },
                        ),
                        D_1(
                          l,
                          {
                            size: `xs`,
                            icon: `i-heroicons-magnifying-glass`,
                            class: `ml-2`,
                            color: `neutral`,
                            variant: `ghost`,
                            onClick: fe,
                          },
                          {
                            default: qt(() => [
                              ...(i[8] ||= [E_1(` Find `, -1)]),
                            ]),
                            _: 1,
                          },
                        ),
                        D_1(
                          l,
                          {
                            size: `xs`,
                            icon: `i-heroicons-document-duplicate`,
                            color: `neutral`,
                            variant: `ghost`,
                            class: `ml-2`,
                            onClick: pe,
                          },
                          {
                            default: qt(() => [
                              ...(i[9] ||= [E_1(` Fork `, -1)]),
                            ]),
                            _: 1,
                          },
                        ),
                        D_1(
                          l,
                          {
                            size: `xs`,
                            icon: `i-heroicons-check`,
                            class: `ml-2`,
                            color: `success`,
                            variant: `ghost`,
                            disabled: !On(Y),
                            onClick: Z,
                          },
                          {
                            default: qt(() => [
                              ...(i[10] ||= [E_1(` Save `, -1)]),
                            ]),
                            _: 1,
                          },
                          8,
                          [`disabled`],
                        ),
                      ]),
                    ]),
                    __1(`div`, U, [
                      D_1(
                        u,
                        {
                          ref_key: `editorRef`,
                          ref: q,
                          modelValue: On(M),
                          "onUpdate:modelValue": (i[1] ||= (e) => {
                            if (un(M)) {
                              return (M.value = e);
                            }
                            return null;
                          }),
                          lang: `python`,
                          options,
                          class: `h-full`,
                          onLoad,
                        },
                        {
                          default: qt(() => [
                            ...(i[11] ||= [E_1(` Loading editor... `, -1)]),
                          ]),
                          _: 1,
                        },
                        8,
                        [`modelValue`],
                      ),
                    ]),
                  ]),
                ]),
                _: 1,
              }),
            ]),
          ]),
          D_1(
            x,
            {
              open: On(d),
              "onUpdate:open": (i[4] ||= (e) => {
                if (un(d)) {
                  return (d.value = e);
                }
                return null;
              }),
            },
            {
              content: qt(() => [
                D_1(v, null, {
                  header: qt(() => [
                    ...(i[12] ||= [
                      __1(
                        `h3`,
                        {
                          class: `font-semibold text-base`,
                        },
                        `Fork Strategy`,
                        -1,
                      ),
                    ]),
                  ]),
                  footer: qt(() => [
                    __1(`div`, se, [
                      D_1(
                        l,
                        {
                          color: `neutral`,
                          variant: `ghost`,
                          onClick: (i[3] ||= (e) => (d.value = false)),
                        },
                        {
                          default: qt(() => [
                            ...(i[13] ||= [E_1(`Cancel`, -1)]),
                          ]),
                          _: 1,
                        },
                      ),
                      D_1(
                        l,
                        {
                          color: `primary`,
                          disabled: !On(b).trim(),
                          onClick: $,
                        },
                        {
                          default: qt(() => [...(i[14] ||= [E_1(`Fork`, -1)])]),
                          _: 1,
                        },
                        8,
                        [`disabled`],
                      ),
                    ]),
                  ]),
                  default: qt(() => [
                    D_1(
                      _,
                      {
                        label: `New strategy name`,
                      },
                      {
                        default: qt(() => [
                          D_1(
                            g,
                            {
                              ref_key: `forkInputRef`,
                              ref: T,
                              modelValue: On(b),
                              "onUpdate:modelValue": (i[2] ||= (e) => {
                                if (un(b)) {
                                  return (b.value = e);
                                }
                                return null;
                              }),
                              placeholder: `Enter new strategy name`,
                              onKeydown: Jt($, [`enter`]),
                            },
                            null,
                            8,
                            [`modelValue`],
                          ),
                        ]),
                        _: 1,
                      },
                    ),
                  ]),
                  _: 1,
                }),
              ]),
              _: 1,
            },
            8,
            [`open`],
          ),
          D_1(
            S,
            {
              modelValue: On(t),
              "onUpdate:modelValue": (i[5] ||= (e) => {
                if (un(t)) {
                  return (t.value = e);
                }
                return null;
              }),
              title: `Delete strategy`,
              description: `Are you sure you want to delete the strategy '${On(E)}'?`,
              type: `info`,
            },
            {
              default: qt(() => [
                D_1(l, {
                  variant: `solid`,
                  color: `error`,
                  block: ``,
                  class: `sm:w-auto`,
                  label: `Delete`,
                  onClick: me,
                }),
              ]),
              _: 1,
            },
            8,
            [`modelValue`, `description`],
          ),
        ],
        64,
      );
    };
  },
});
export { W as default };
