import {
  $ as $_1,
  D as D_1,
  E,
  Ft,
  Ht,
  Lt,
  Nt,
  On,
  Pt,
  Qn,
  Tn,
  _,
  b,
  et,
  g,
  k,
  mt,
  nr,
  o as o_1,
  qt,
  v,
  xt,
  y,
} from "./CoKk4mC0.js";
import { Jt, Yt } from "./Cd-sGgPF.js";
import { U as U_1 } from "./B8_r5oP7.js";
import { c } from "./CioJR-lb.js";
import { g as g_2, r as r_1 } from "./DPJPAjQR.js";
import { E as E_2, a, i as i_1, j, m, v as v_2, y as y_2 } from "./CJNUlr67.js";
import { n } from "./CC-BCOei.js";
import { t } from "./JaHKEXQh.js";
import { t as t_2 } from "./CC8GggWq2.js";
import { n as n_2 } from "./BG8CfSEZ2.js";
const [B, V] = j(`SwitchRoot`);
const H = k({
  inheritAttrs: false,
  __name: `SwitchRoot`,
  props: {
    defaultValue: {
      type: null,
      required: false,
    },
    modelValue: {
      type: null,
      required: false,
      default: undefined,
    },
    disabled: {
      type: Boolean,
      required: false,
    },
    id: {
      type: String,
      required: false,
    },
    value: {
      type: String,
      required: false,
      default: `on`,
    },
    trueValue: {
      type: null,
      required: false,
      default: () => true,
    },
    falseValue: {
      type: null,
      required: false,
      default: () => false,
    },
    asChild: {
      type: Boolean,
      required: false,
    },
    as: {
      type: null,
      required: false,
      default: `button`,
    },
    name: {
      type: String,
      required: false,
    },
    required: {
      type: Boolean,
      required: false,
    },
  },
  emits: [`update:modelValue`],
  setup(e, { emit }) {
    let r = e;
    let i = emit;
    let { disabled } = Tn(r);
    let o = g_2(r, `modelValue`, i, {
      defaultValue: r.defaultValue ?? r.falseValue,
      passive: r.modelValue === undefined,
    });
    let c = g(() => o.value === r.trueValue);
    function l() {
      if (!disabled.value) {
        o.value = c.value ? r.falseValue : r.trueValue;
      }
    }
    let { forwardRef, currentElement } = r_1();
    let _ = n(currentElement);
    let T = t();
    let E = g(() => {
      if (r.id && currentElement.value) {
        return document.querySelector(`[for="${r.id}"]`)?.innerText;
      }
    });
    V({
      checked: c,
      toggleCheck: l,
      disabled,
    });
    return (e, n) => {
      mt();
      return b(
        o_1,
        null,
        [
          D_1(
            On(E_2),
            et(
              {
                id: e.id,
                ref: On(forwardRef),
                role: `switch`,
                type: e.as === `button` ? `button` : undefined,
                value: e.value,
                "aria-label": e.$attrs[`aria-label`] || E.value,
                "aria-checked": c.value,
                "aria-required": e.required,
                "data-state": c.value ? `checked` : `unchecked`,
                "data-disabled": On(disabled) ? `` : undefined,
                "as-child": e.asChild,
                as: e.as,
                disabled: On(disabled),
              },
              {
                ...On(T),
                ...e.$attrs,
              },
              {
                onClick: l,
                onKeydown: Jt(Yt(l, [`prevent`]), [`enter`]),
              },
            ),
            {
              default: qt(() => [
                xt(e.$slots, `default`, {
                  modelValue: On(o),
                  checked: c.value,
                }),
              ]),
              _: 3,
            },
            16,
            [
              `id`,
              `type`,
              `value`,
              `aria-label`,
              `aria-checked`,
              `aria-required`,
              `data-state`,
              `data-disabled`,
              `as-child`,
              `as`,
              `disabled`,
              `onKeydown`,
            ],
          ),
          On(_) && e.name
            ? (mt(),
              v(
                On(t_2),
                et(
                  {
                    key: 0,
                    type: `checkbox`,
                    name: e.name,
                    disabled: On(disabled),
                    required: e.required,
                    value: e.value,
                    checked: c.value,
                  },
                  On(T),
                ),
                null,
                16,
                [`name`, `disabled`, `required`, `value`, `checked`],
              ))
            : y(`v-if`, true),
        ],
        64,
      );
    };
  },
});
const U = k({
  __name: `SwitchThumb`,
  props: {
    asChild: {
      type: Boolean,
      required: false,
    },
    as: {
      type: null,
      required: false,
      default: `span`,
    },
  },
  setup(e) {
    let t = B();
    r_1();
    return (e, n) => {
      mt();
      return v(
        On(E_2),
        {
          "data-state": On(t).checked.value ? `checked` : `unchecked`,
          "data-disabled": On(t).disabled.value ? `` : undefined,
          "as-child": e.asChild,
          as: e.as,
        },
        {
          default: qt(() => [xt(e.$slots, `default`)]),
          _: 3,
        },
        8,
        [`data-state`, `data-disabled`, `as-child`, `as`],
      );
    };
  },
});
const extend = {
  slots: {
    root: `relative flex items-start`,
    base: [
      `inline-flex items-center shrink-0 rounded-full border-2 border-transparent focus-visible:outline-3 data-[state=unchecked]:bg-accented`,
      `transition-[background] duration-200`,
    ],
    container: `flex items-center`,
    thumb: `group pointer-events-none rounded-full bg-default shadow-lg ring-0 transition-transform duration-200 data-[state=unchecked]:translate-x-0 data-[state=unchecked]:rtl:-translate-x-0 flex items-center justify-center`,
    icon: [
      `absolute shrink-0 group-data-[state=unchecked]:text-dimmed opacity-0 size-10/12`,
      `transition-[color,opacity] duration-200`,
    ],
    wrapper: `ms-2`,
    label: `block font-medium text-default`,
    description: `text-muted`,
  },
  variants: {
    color: {
      primary: {
        base: `data-[state=checked]:bg-primary outline-primary/25`,
        icon: `group-data-[state=checked]:text-primary`,
      },
      secondary: {
        base: `data-[state=checked]:bg-secondary outline-secondary/25`,
        icon: `group-data-[state=checked]:text-secondary`,
      },
      success: {
        base: `data-[state=checked]:bg-success outline-success/25`,
        icon: `group-data-[state=checked]:text-success`,
      },
      info: {
        base: `data-[state=checked]:bg-info outline-info/25`,
        icon: `group-data-[state=checked]:text-info`,
      },
      warning: {
        base: `data-[state=checked]:bg-warning outline-warning/25`,
        icon: `group-data-[state=checked]:text-warning`,
      },
      error: {
        base: `data-[state=checked]:bg-error outline-error/25`,
        icon: `group-data-[state=checked]:text-error`,
      },
      neutral: {
        base: `data-[state=checked]:bg-inverted outline-inverted/25`,
        icon: `group-data-[state=checked]:text-highlighted`,
      },
    },
    size: {
      xs: {
        base: `w-7`,
        container: `h-4`,
        thumb: `size-3 data-[state=checked]:translate-x-3 data-[state=checked]:rtl:-translate-x-3`,
        wrapper: `text-xs`,
      },
      sm: {
        base: `w-8`,
        container: `h-4`,
        thumb: `size-3.5 data-[state=checked]:translate-x-3.5 data-[state=checked]:rtl:-translate-x-3.5`,
        wrapper: `text-xs`,
      },
      md: {
        base: `w-9`,
        container: `h-5`,
        thumb: `size-4 data-[state=checked]:translate-x-4 data-[state=checked]:rtl:-translate-x-4`,
        wrapper: `text-sm`,
      },
      lg: {
        base: `w-10`,
        container: `h-5`,
        thumb: `size-4.5 data-[state=checked]:translate-x-4.5 data-[state=checked]:rtl:-translate-x-4.5`,
        wrapper: `text-sm`,
      },
      xl: {
        base: `w-11`,
        container: `h-6`,
        thumb: `size-5 data-[state=checked]:translate-x-5 data-[state=checked]:rtl:-translate-x-5`,
        wrapper: `text-base`,
      },
    },
    checked: {
      true: {
        icon: `group-data-[state=checked]:opacity-100`,
      },
    },
    unchecked: {
      true: {
        icon: `group-data-[state=unchecked]:opacity-100`,
      },
    },
    loading: {
      true: {
        icon: `animate-spin`,
      },
    },
    highlight: {
      true: ``,
    },
    required: {
      true: {
        label: `after:content-['*'] after:ms-0.5 after:text-error`,
      },
    },
    disabled: {
      true: {
        root: `opacity-75`,
        base: `cursor-not-allowed`,
        label: `cursor-not-allowed`,
        description: `cursor-not-allowed`,
      },
    },
  },
  compoundVariants: [
    {
      color: `primary`,
      highlight: true,
      class: {
        base: `ring ring-primary`,
      },
    },
    {
      color: `secondary`,
      highlight: true,
      class: {
        base: `ring ring-secondary`,
      },
    },
    {
      color: `success`,
      highlight: true,
      class: {
        base: `ring ring-success`,
      },
    },
    {
      color: `info`,
      highlight: true,
      class: {
        base: `ring ring-info`,
      },
    },
    {
      color: `warning`,
      highlight: true,
      class: {
        base: `ring ring-warning`,
      },
    },
    {
      color: `error`,
      highlight: true,
      class: {
        base: `ring ring-error`,
      },
    },
    {
      color: `neutral`,
      highlight: true,
      class: {
        base: `ring ring-inverted`,
      },
    },
  ],
  defaultVariants: {
    color: `primary`,
    size: `sm`,
  },
};
const G = {
  inheritAttrs: false,
  ...{
    __name: `USwitch`,
    props: {
      as: {
        type: null,
        required: false,
      },
      color: {
        type: null,
        required: false,
      },
      size: {
        type: null,
        required: false,
      },
      highlight: {
        type: Boolean,
        required: false,
      },
      loading: {
        type: Boolean,
        required: false,
      },
      loadingIcon: {
        type: null,
        required: false,
      },
      checkedIcon: {
        type: null,
        required: false,
      },
      uncheckedIcon: {
        type: null,
        required: false,
      },
      label: {
        type: String,
        required: false,
      },
      description: {
        type: String,
        required: false,
      },
      class: {
        type: null,
        required: false,
      },
      ui: {
        type: Object,
        required: false,
      },
      disabled: {
        type: Boolean,
        required: false,
      },
      id: {
        type: String,
        required: false,
      },
      name: {
        type: String,
        required: false,
      },
      required: {
        type: Boolean,
        required: false,
      },
      value: {
        type: String,
        required: false,
      },
      defaultValue: {
        type: null,
        required: false,
      },
      modelValue: {
        type: null,
        required: false,
      },
      trueValue: {
        type: null,
        required: false,
      },
      falseValue: {
        type: null,
        required: false,
      },
    },
    emits: [`change`, `update:modelValue`],
    setup(e, { emit }) {
      let i = e;
      let u = Lt();
      let h = emit;
      let C = y_2(`switch`, i);
      let w = c();
      let D = v_2(
        U_1(
          C,
          `required`,
          `value`,
          `defaultValue`,
          `modelValue`,
          `trueValue`,
          `falseValue`,
        ),
        h,
      );
      let {
        id,
        emitFormChange,
        emitFormInput,
        size,
        color,
        highlight,
        name,
        disabled,
        ariaAttrs,
      } = m(i);
      let q = id.value ?? Pt();
      let J = Nt();
      let Y = g(() => {
        let { "data-state": data_state, ...rest } = J;
        return rest;
      });
      let X = g(() =>
        a({
          extend,
          ...(w.ui?.switch || {}),
        })({
          size: size.value ?? C.size,
          color: color.value ?? C.color,
          highlight: highlight.value ?? C.highlight,
          required: C.required,
          loading: C.loading,
          disabled: disabled.value || C.loading,
        }),
      );
      function Z(value) {
        let t = new Event(`change`, {
          target: {
            value,
          },
        });
        h(`change`, t);
        emitFormChange();
        emitFormInput();
      }
      return (e, r) => {
        mt();
        return v(
          On(E_2),
          {
            as: On(C).as,
            "data-slot": e.$attrs[`data-slot`] ?? `root`,
            class: Qn(
              X.value.root({
                class: [On(C).ui?.root, On(C).class],
              }),
            ),
          },
          {
            default: qt(() => [
              _(
                `div`,
                {
                  "data-slot": `container`,
                  class: Qn(
                    X.value.container({
                      class: On(C).ui?.container,
                    }),
                  ),
                },
                [
                  D_1(
                    On(H),
                    et(
                      {
                        id: On(q),
                      },
                      {
                        ...On(D),
                        ...Y.value,
                        ...On(ariaAttrs),
                      },
                      {
                        name: On(name),
                        disabled: On(disabled) || On(C).loading,
                        "data-slot": `base`,
                        class: X.value.base({
                          class: On(C).ui?.base,
                        }),
                        "onUpdate:modelValue": Z,
                      },
                    ),
                    {
                      default: qt(() => [
                        D_1(
                          On(U),
                          {
                            "data-slot": `thumb`,
                            class: Qn(
                              X.value.thumb({
                                class: On(C).ui?.thumb,
                              }),
                            ),
                          },
                          {
                            default: qt(() => [
                              On(C).loading
                                ? (mt(),
                                  v(
                                    i_1,
                                    {
                                      key: 0,
                                      name:
                                        On(C).loadingIcon ||
                                        On(w).ui.icons.loading,
                                      "data-slot": `icon`,
                                      class: Qn(
                                        X.value.icon({
                                          class: On(C).ui?.icon,
                                          checked: true,
                                          unchecked: true,
                                        }),
                                      ),
                                    },
                                    null,
                                    8,
                                    [`name`, `class`],
                                  ))
                                : (mt(),
                                  b(
                                    o_1,
                                    {
                                      key: 1,
                                    },
                                    [
                                      On(C).checkedIcon
                                        ? (mt(),
                                          v(
                                            i_1,
                                            {
                                              key: 0,
                                              name: On(C).checkedIcon,
                                              "data-slot": `icon`,
                                              class: Qn(
                                                X.value.icon({
                                                  class: On(C).ui?.icon,
                                                  checked: true,
                                                }),
                                              ),
                                            },
                                            null,
                                            8,
                                            [`name`, `class`],
                                          ))
                                        : y(``, true),
                                      On(C).uncheckedIcon
                                        ? (mt(),
                                          v(
                                            i_1,
                                            {
                                              key: 1,
                                              name: On(C).uncheckedIcon,
                                              "data-slot": `icon`,
                                              class: Qn(
                                                X.value.icon({
                                                  class: On(C).ui?.icon,
                                                  unchecked: true,
                                                }),
                                              ),
                                            },
                                            null,
                                            8,
                                            [`name`, `class`],
                                          ))
                                        : y(``, true),
                                    ],
                                    64,
                                  )),
                            ]),
                            _: 1,
                          },
                          8,
                          [`class`],
                        ),
                      ]),
                      _: 1,
                    },
                    16,
                    [`id`, `name`, `disabled`, `class`],
                  ),
                ],
                2,
              ),
              On(C).label || u.label || On(C).description || u.description
                ? (mt(),
                  b(
                    `div`,
                    {
                      key: 0,
                      "data-slot": `wrapper`,
                      class: Qn(
                        X.value.wrapper({
                          class: On(C).ui?.wrapper,
                        }),
                      ),
                    },
                    [
                      On(C).label || u.label
                        ? (mt(),
                          v(
                            On(n_2),
                            {
                              key: 0,
                              for: On(q),
                              "data-slot": `label`,
                              class: Qn(
                                X.value.label({
                                  class: On(C).ui?.label,
                                }),
                              ),
                            },
                            {
                              default: qt(() => [
                                xt(
                                  e.$slots,
                                  `label`,
                                  {
                                    label: On(C).label,
                                  },
                                  () => [E(nr(On(C).label), 1)],
                                ),
                              ]),
                              _: 3,
                            },
                            8,
                            [`for`, `class`],
                          ))
                        : y(``, true),
                      On(C).description || u.description
                        ? (mt(),
                          b(
                            `p`,
                            {
                              key: 1,
                              "data-slot": `description`,
                              class: Qn(
                                X.value.description({
                                  class: On(C).ui?.description,
                                }),
                              ),
                            },
                            [
                              xt(
                                e.$slots,
                                `description`,
                                {
                                  description: On(C).description,
                                },
                                () => [E(nr(On(C).description), 1)],
                              ),
                            ],
                            2,
                          ))
                        : y(``, true),
                    ],
                    2,
                  ))
                : y(``, true),
            ]),
            _: 3,
          },
          8,
          [`as`, `data-slot`, `class`],
        );
      };
    },
  },
};
const K = {
  class: `min-w-0`,
};
const q = {
  class: `text-xs font-semibold text-gray-700 dark:text-gray-200`,
};
const J = {
  key: 0,
  class: `font-normal`,
};
const Y = {
  key: 0,
  class: `mt-0.5 text-[11px] leading-4 text-gray-400 dark:text-gray-500`,
};
const X = {
  key: 1,
};
const Z = {
  class: `flex justify-between items-center`,
};
const Q = {
  class: `font-medium text-gray-700 dark:text-gray-200`,
};
const $ = {
  key: 0,
  class: `opacity-70 text-sm`,
};
const ee = {
  key: 0,
  class: `text-sm text-gray-500 dark:text-gray-400`,
};
const te = Object.assign(
  k({
    __name: `ToggleButton`,
    props: $_1(
      {
        title: {},
        description: {},
        disabled: {
          type: Boolean,
        },
        disabledGuide: {},
        compact: {
          type: Boolean,
        },
      },
      {
        modelValue: {
          type: Boolean,
          default: false,
        },
        modelModifiers: {},
      },
    ),
    emits: [`update:modelValue`],
    setup(e) {
      let a = Ft(e, `modelValue`);
      let o = e;
      Ht(
        () => o.disabled,
        (e) => {
          if (e) {
            a.value = false;
          }
        },
        {
          immediate: true,
        },
      );
      return (r, i) => {
        let o = G;
        if (e.compact) {
          return (
            mt(),
            b(
              `label`,
              {
                key: 0,
                class: Qn([
                  `flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 dark:border-gray-700 dark:bg-gray-800/70`,
                  e.disabled
                    ? `cursor-not-allowed opacity-60`
                    : `cursor-pointer hover:border-gray-300 dark:hover:border-gray-600`,
                ]),
              },
              [
                _(`div`, K, [
                  _(`div`, q, [
                    E(nr(e.title) + ` `, 1),
                    e.disabled
                      ? (mt(), b(`span`, J, `(` + nr(e.disabledGuide) + `)`, 1))
                      : y(``, true),
                  ]),
                  e.description
                    ? (mt(), b(`div`, Y, nr(e.description), 1))
                    : y(``, true),
                ]),
                D_1(
                  o,
                  {
                    modelValue: a.value,
                    "onUpdate:modelValue": (i[0] ||= (e) => (a.value = e)),
                    disabled: e.disabled,
                    class: `shrink-0`,
                  },
                  null,
                  8,
                  [`modelValue`, `disabled`],
                ),
              ],
              2,
            )
          );
        }
        return (
          mt(),
          b(`div`, X, [
            _(`div`, Z, [
              _(`div`, Q, [
                E(nr(e.title) + ` `, 1),
                e.disabled
                  ? (mt(), b(`span`, $, `(` + nr(e.disabledGuide) + `)`, 1))
                  : y(``, true),
              ]),
              D_1(
                o,
                {
                  modelValue: a.value,
                  "onUpdate:modelValue": (i[1] ||= (e) => (a.value = e)),
                  disabled: e.disabled,
                },
                null,
                8,
                [`modelValue`, `disabled`],
              ),
            ]),
            e.description
              ? (mt(), b(`div`, ee, nr(e.description), 1))
              : y(``, true),
          ])
        );
      };
    },
  }),
  {
    __name: `ToggleButton`,
  },
);
export { te as t };
