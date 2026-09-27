import {
  $,
  D as D_1,
  E as E_1,
  Ft,
  Ht,
  _,
  ft,
  g,
  k,
  mt,
  qt,
  tt,
  v,
  vn,
} from "./CoKk4mC0.js";
import { t as t_1 } from "./2k_QeT3T.js";
import { D as D_2, O as O_1, f, n } from "./B8_r5oP7.js";
import { o as o_1, s } from "./CioJR-lb.js";
import { t as t_2 } from "./OaeI3Ulg.js";
import { t as t_3 } from "./CJNUlr67.js";
import { t as t_4 } from "./D1yN6wZY2.js";
import { t as t_5 } from "./Cuy4t56v.js";
const T = s(t_5);
const E = {
  class: `flex items-center justify-between`,
};
const D = {
  class: `space-y-4`,
};
const O = {
  class: `flex justify-end gap-3`,
};
export const t = Object.assign(
  k({
    __name: `MonteCarloNotesModal`,
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
      let w = emit;
      let k = Ft(e, `modelValue`);
      let A = vn(b.initialTitle || ``);
      let j = vn(b.initialDescription || ``);
      let M = vn(false);
      let N = vn();
      let P = f();
      let F = g(() => {
        if (P.value === `light`) {
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
      let L = g(
        () =>
          A.value !== (b.initialTitle || ``) ||
          j.value !== (b.initialDescription || ``),
      );
      Ht(F, (theme) => {
        N.value?.$editor?.updateOptions({
          theme,
        });
      });
      Ht(
        () => b.initialTitle,
        (e) => {
          A.value = e || ``;
        },
      );
      Ht(
        () => b.initialDescription,
        (e) => {
          j.value = e || ``;
        },
      );
      Ht(k, async (e) => {
        if (e) {
          await tt();
          setTimeout(() => {
            if (N.value?.$editor) {
              N.value.$editor.updateOptions({
                theme: F.value,
              });
              N.value.$editor.addCommand(2051, () => {
                z();
              });
            }
          }, 100);
          window.addEventListener(`keydown`, R);
        } else {
          window.removeEventListener(`keydown`, R);
        }
      });
      ft(() => {
        window.removeEventListener(`keydown`, R);
      });
      function R(e) {
        if ((e.metaKey || e.ctrlKey) && e.key === `Enter`) {
          e.preventDefault();
          z();
        }
      }
      async function z() {
        if (L.value) {
          M.value = true;
          try {
            await n().updateSessionNotes(b.sessionId, A.value, j.value);
            O_1(`success`, `Notes saved successfully`);
            w(`saved`, {
              title: A.value,
              description: j.value,
            });
            k.value = false;
          } catch (e) {
            D_2(e);
          } finally {
            M.value = false;
          }
        }
      }
      return (e, r) => {
        let i = t_3;
        let o = t_1;
        let s = T;
        let c = o_1;
        let d = t_4;
        let p = t_2;
        mt();
        return v(
          p,
          {
            open: k.value,
            "onUpdate:open": (r[4] ||= (e) => (k.value = e)),
            ui: {
              content: `sm:max-w-3xl`,
            },
          },
          {
            content: qt(() => [
              D_1(
                d,
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
                    _(`div`, E, [
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
                        onClick: (r[0] ||= (e) => (k.value = false)),
                      }),
                    ]),
                  ]),
                  footer: qt(() => [
                    _(`div`, O, [
                      D_1(i, {
                        color: `neutral`,
                        variant: `ghost`,
                        label: `Cancel`,
                        onClick: (r[3] ||= (e) => (k.value = false)),
                      }),
                      D_1(
                        i,
                        {
                          color: `primary`,
                          label: `Save`,
                          icon: `i-heroicons-check`,
                          disabled: !L.value,
                          loading: M.value,
                          onClick: z,
                        },
                        null,
                        8,
                        [`disabled`, `loading`],
                      ),
                    ]),
                  ]),
                  default: qt(() => [
                    _(`div`, D, [
                      _(`div`, null, [
                        (r[6] ||= _(
                          `label`,
                          {
                            class: `block text-sm font-medium mb-2`,
                          },
                          `Title`,
                          -1,
                        )),
                        D_1(
                          o,
                          {
                            modelValue: A.value,
                            "onUpdate:modelValue": (r[1] ||= (e) =>
                              (A.value = e)),
                            placeholder: `Enter a title for this Monte Carlo session`,
                            maxlength: `255`,
                            size: `lg`,
                            autofocus: ``,
                          },
                          null,
                          8,
                          [`modelValue`],
                        ),
                      ]),
                      _(`div`, null, [
                        (r[8] ||= _(
                          `label`,
                          {
                            class: `block text-sm font-medium mb-2`,
                          },
                          `Description`,
                          -1,
                        )),
                        D_1(c, null, {
                          default: qt(() => [
                            D_1(
                              s,
                              {
                                ref_key: `descriptionEditorRef`,
                                ref: N,
                                modelValue: j.value,
                                "onUpdate:modelValue": (r[2] ||= (e) =>
                                  (j.value = e)),
                                lang: `markdown`,
                                options,
                                class: `border border-gray-200 dark:border-gray-800 rounded-sm`,
                                style: {
                                  height: `clamp(15rem, 45dvh, 25rem)`,
                                },
                              },
                              {
                                default: qt(() => [
                                  ...(r[7] ||= [
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
    __name: `MonteCarloNotesModal`,
  },
);
