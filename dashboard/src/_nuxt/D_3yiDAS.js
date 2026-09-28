import {
  $,
  D as D_1,
  E as E_1,
  Ft,
  Ht,
  _,
  ft,
  g,
  k as k_1,
  mt,
  qt,
  tt,
  v,
  vn,
} from "./CoKk4mC0.js";
import { t as t_1 } from "./2k_QeT3T.js";
import { D as D_2, O as O_1, d, f } from "./B8_r5oP7.js";
import { o as o_1, s } from "./CioJR-lb.js";
import { t as t_2 } from "./OaeI3Ulg.js";
import { t as t_3 } from "./CJNUlr67.js";
import { t as t_4 } from "./BG8CfSEZ2.js";
import { t as t_5 } from "./D1yN6wZY2.js";
import { t as t_6 } from "./Cuy4t56v.js";
const E = s(t_6);
const D = {
  class: `flex items-center justify-between`,
};
const O = {
  class: `space-y-4`,
};
const k = {
  class: `flex justify-end gap-3`,
};
export const t = Object.assign(
  k_1({
    __name: `BacktestNotesModal`,
    props: $(
      {
        sessionId: {},
        initialTitle: {},
        initialDescription: {},
      },
      {
        modelValue: {
          type: Boolean,
          default: false,
        },
        modelModifiers: {},
      },
    ),
    emits: $([`saved`], [`update:modelValue`]),
    setup(e, { emit }) {
      let b = e;
      let T = emit;
      let A = Ft(e, `modelValue`);
      let j = vn(b.initialTitle || ``);
      let M = vn(b.initialDescription || ``);
      let N = vn(false);
      let P = vn();
      let F = f();
      let I = g(() => {
        if (F.value === `light`) {
          return `vs-light`;
        }
        return `vs-dark`;
      });
      let options = {
        automaticLayout: true,
        minimap: {
          enabled: false,
        },
        fontSize: 15,
        lineHeight: 21,
        wordWrap: `on`,
      };
      let R = g(
        () =>
          j.value !== (b.initialTitle || ``) ||
          M.value !== (b.initialDescription || ``),
      );
      Ht(I, (theme) => {
        P.value?.$editor?.updateOptions({
          theme,
        });
      });
      Ht(
        () => b.initialTitle,
        (e) => {
          j.value = e || ``;
        },
      );
      Ht(
        () => b.initialDescription,
        (e) => {
          M.value = e || ``;
        },
      );
      Ht(A, async (e) => {
        if (e) {
          await tt();
          setTimeout(() => {
            if (P.value?.$editor) {
              P.value.$editor.updateOptions({
                theme: I.value,
              });
              P.value.$editor.addCommand(2051, () => {
                B();
              });
            }
          }, 100);
          window.addEventListener(`keydown`, z);
        } else {
          window.removeEventListener(`keydown`, z);
        }
      });
      ft(() => {
        window.removeEventListener(`keydown`, z);
      });
      function z(e) {
        if ((e.metaKey || e.ctrlKey) && e.key === `Enter`) {
          e.preventDefault();
          B();
        }
      }
      async function B() {
        if (R.value) {
          N.value = true;
          try {
            await d().updateSessionNotes(b.sessionId, j.value, M.value);
            O_1(`success`, `Notes saved successfully`);
            T(`saved`, {
              title: j.value,
              description: M.value,
            });
            A.value = false;
          } catch (e) {
            D_2(e);
          } finally {
            N.value = false;
          }
        }
      }
      return (e, r) => {
        let i = t_3;
        let o = t_1;
        let s = t_4;
        let c = E;
        let d = o_1;
        let p = t_5;
        let h = t_2;
        mt();
        return v(
          h,
          {
            open: A.value,
            "onUpdate:open": (r[4] ||= (e) => (A.value = e)),
            ui: {
              content: `sm:max-w-3xl`,
            },
          },
          {
            content: qt(() => [
              D_1(
                p,
                {
                  ui: {
                    root: `flex max-h-[calc(100dvh-2rem)] flex-col overflow-hidden`,
                    header: `shrink-0`,
                    body: `min-h-0 overflow-y-auto`,
                    footer: `shrink-0`,
                  },
                },
                {
                  header: qt(() => [
                    _(`div`, D, [
                      (r[5] ||= _(
                        `h3`,
                        {
                          class: `text-lg font-semibold`,
                        },
                        `Add Title & Notes`,
                        -1,
                      )),
                      D_1(i, {
                        color: `neutral`,
                        variant: `ghost`,
                        icon: `i-heroicons-x-mark`,
                        size: `sm`,
                        "aria-label": `Close`,
                        onClick: (r[0] ||= (e) => (A.value = false)),
                      }),
                    ]),
                  ]),
                  footer: qt(() => [
                    _(`div`, k, [
                      D_1(i, {
                        color: `neutral`,
                        variant: `ghost`,
                        label: `Cancel`,
                        onClick: (r[3] ||= (e) => (A.value = false)),
                      }),
                      D_1(
                        i,
                        {
                          color: `primary`,
                          label: `Save`,
                          icon: `i-heroicons-check`,
                          disabled: !R.value,
                          loading: N.value,
                          onClick: B,
                        },
                        null,
                        8,
                        [`disabled`, `loading`],
                      ),
                    ]),
                  ]),
                  default: qt(() => [
                    _(`div`, O, [
                      D_1(
                        s,
                        {
                          label: `Title`,
                        },
                        {
                          default: qt(() => [
                            D_1(
                              o,
                              {
                                modelValue: j.value,
                                "onUpdate:modelValue": (r[1] ||= (e) =>
                                  (j.value = e)),
                                placeholder: `Enter a title for this backtest`,
                                maxlength: `255`,
                                size: `lg`,
                                class: `w-full`,
                                autofocus: ``,
                              },
                              null,
                              8,
                              [`modelValue`],
                            ),
                          ]),
                          _: 1,
                        },
                      ),
                      _(`div`, null, [
                        (r[7] ||= _(
                          `label`,
                          {
                            class: `block text-sm font-medium mb-2`,
                          },
                          `Description`,
                          -1,
                        )),
                        D_1(d, null, {
                          default: qt(() => [
                            D_1(
                              c,
                              {
                                ref_key: `descriptionEditorRef`,
                                ref: P,
                                modelValue: M.value,
                                "onUpdate:modelValue": (r[2] ||= (e) =>
                                  (M.value = e)),
                                lang: `markdown`,
                                options,
                                class: `border border-gray-200 dark:border-gray-800 rounded-sm`,
                                style: {
                                  height: `clamp(15rem, 45dvh, 25rem)`,
                                },
                              },
                              {
                                default: qt(() => [
                                  ...(r[6] ||= [
                                    E_1(` Loading editor... `, -1),
                                  ]),
                                ]),
                                _: 1,
                              },
                              8,
                              [`modelValue`],
                            ),
                          ]),
                          _: 1,
                        }),
                      ]),
                    ]),
                  ]),
                  _: 1,
                },
              ),
            ]),
            _: 1,
          },
          8,
          [`open`],
        );
      };
    },
  }),
  {
    __name: `BacktestNotesModal`,
  },
);
