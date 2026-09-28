import {
  Ht,
  Lt,
  On,
  Qn,
  Rt,
  _,
  b,
  ct,
  et,
  g as g_1,
  mt,
  qt,
  tt,
  v,
  xt,
  y,
} from "./CoKk4mC0.js";
import { tt as tt_1, ut } from "./B8_r5oP7.js";
import { c } from "./CioJR-lb.js";
import { g as g_2 } from "./DPJPAjQR.js";
import { E as E_1, _ as __2, a, i, m, n, w, y as y_2 } from "./CJNUlr67.js";
const E = {
  backtest: `/backtest/`,
  optimization: `/optimization/`,
  monteCarlo: `/monte-carlo/`,
  significanceTest: `/significance-test`,
  live: `/live/`,
};
const D = {
  "backtest-id": `backtest`,
  "optimization-id": `optimization`,
  "monte-carlo-id": `monteCarlo`,
  "significance-test-id": `significanceTest`,
  "live-id": `live`,
};
function O(e) {
  return (
    typeof e == `string` &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(e)
  );
}
export const r = ut(`sessionNavigation`, {
  state: () => ({
    lastOpenedSessionIds: {
      backtest: null,
      optimization: null,
      monteCarlo: null,
      significanceTest: null,
      live: null,
    },
  }),
  getters: {
    navigationPath: (e) => (t) => {
      let n = e.lastOpenedSessionIds[t];
      if (O(n)) {
        return `${E[t].replace(/\/$/, ``)}/${n}`;
      }
      return E[t];
    },
  },
  persist: {
    storage: tt_1.localStorage(),
  },
  actions: {
    rememberRoute(e, t) {
      if (typeof e != `string` || !O(t)) {
        return;
      }
      let n = D[e];
      if (n) {
        this.lastOpenedSessionIds[n] = t;
      }
    },
  },
});
const extend = {
  slots: {
    root: `relative inline-flex items-center`,
    base: [
      `w-full rounded-md border-0 appearance-none placeholder:text-dimmed disabled:cursor-not-allowed disabled:opacity-75`,
      `transition-colors`,
    ],
    leading: `absolute start-0 flex items-start`,
    leadingIcon: `shrink-0 text-dimmed`,
    leadingAvatar: `shrink-0`,
    leadingAvatarSize: ``,
    trailing: `absolute end-0 flex items-start`,
    trailingIcon: `shrink-0 text-dimmed`,
  },
  variants: {
    fieldGroup: {
      horizontal: {
        root: `group has-focus-visible:z-[1]`,
        base: `group-not-only:group-first:rounded-e-none group-not-only:group-last:rounded-s-none group-not-last:group-not-first:rounded-none`,
      },
      vertical: {
        root: `group has-focus-visible:z-[1]`,
        base: `group-not-only:group-first:rounded-b-none group-not-only:group-last:rounded-t-none group-not-last:group-not-first:rounded-none`,
      },
    },
    size: {
      xs: {
        base: `px-2 py-1 text-sm/4 gap-1`,
        leading: `ps-2 inset-y-1`,
        trailing: `pe-2 inset-y-1`,
        leadingIcon: `size-4`,
        leadingAvatarSize: `3xs`,
        trailingIcon: `size-4`,
      },
      sm: {
        base: `px-2.5 py-1.5 text-sm/4 gap-1.5`,
        leading: `ps-2.5 inset-y-1.5`,
        trailing: `pe-2.5 inset-y-1.5`,
        leadingIcon: `size-4`,
        leadingAvatarSize: `3xs`,
        trailingIcon: `size-4`,
      },
      md: {
        base: `px-2.5 py-1.5 text-base/5 gap-1.5`,
        leading: `ps-2.5 inset-y-1.5`,
        trailing: `pe-2.5 inset-y-1.5`,
        leadingIcon: `size-5`,
        leadingAvatarSize: `2xs`,
        trailingIcon: `size-5`,
      },
      lg: {
        base: `px-3 py-2 text-base/5 gap-2`,
        leading: `ps-3 inset-y-2`,
        trailing: `pe-3 inset-y-2`,
        leadingIcon: `size-5`,
        leadingAvatarSize: `2xs`,
        trailingIcon: `size-5`,
      },
      xl: {
        base: `px-3 py-2 text-base gap-2`,
        leading: `ps-3 inset-y-2`,
        trailing: `pe-3 inset-y-2`,
        leadingIcon: `size-6`,
        leadingAvatarSize: `xs`,
        trailingIcon: `size-6`,
      },
    },
    variant: {
      outline: `text-highlighted bg-default ring ring-inset ring-accented`,
      soft: `text-highlighted bg-elevated/50 hover:bg-elevated focus:bg-elevated disabled:bg-elevated/50`,
      subtle: `text-highlighted bg-elevated ring ring-inset ring-accented`,
      ghost: `text-highlighted bg-transparent hover:bg-elevated focus:bg-elevated disabled:bg-transparent dark:disabled:bg-transparent`,
      none: `text-highlighted bg-transparent focus:outline-none`,
    },
    color: {
      primary: ``,
      secondary: ``,
      success: ``,
      info: ``,
      warning: ``,
      error: ``,
      neutral: ``,
    },
    leading: {
      true: ``,
    },
    trailing: {
      true: ``,
    },
    loading: {
      true: ``,
    },
    highlight: {
      true: ``,
    },
    fixed: {
      false: ``,
    },
    type: {
      file: `file:me-1.5 file:font-medium file:text-muted file:outline-none`,
    },
    autoresize: {
      true: {
        base: `resize-none`,
      },
    },
  },
  compoundVariants: [
    {
      color: `primary`,
      variant: [`outline`, `subtle`],
      class: `outline-primary/25 focus-visible:outline-3 focus-visible:ring-primary`,
    },
    {
      color: `secondary`,
      variant: [`outline`, `subtle`],
      class: `outline-secondary/25 focus-visible:outline-3 focus-visible:ring-secondary`,
    },
    {
      color: `success`,
      variant: [`outline`, `subtle`],
      class: `outline-success/25 focus-visible:outline-3 focus-visible:ring-success`,
    },
    {
      color: `info`,
      variant: [`outline`, `subtle`],
      class: `outline-info/25 focus-visible:outline-3 focus-visible:ring-info`,
    },
    {
      color: `warning`,
      variant: [`outline`, `subtle`],
      class: `outline-warning/25 focus-visible:outline-3 focus-visible:ring-warning`,
    },
    {
      color: `error`,
      variant: [`outline`, `subtle`],
      class: `outline-error/25 focus-visible:outline-3 focus-visible:ring-error`,
    },
    {
      color: `primary`,
      variant: [`soft`, `ghost`],
      class: `outline-primary/25 focus-visible:outline-3`,
    },
    {
      color: `secondary`,
      variant: [`soft`, `ghost`],
      class: `outline-secondary/25 focus-visible:outline-3`,
    },
    {
      color: `success`,
      variant: [`soft`, `ghost`],
      class: `outline-success/25 focus-visible:outline-3`,
    },
    {
      color: `info`,
      variant: [`soft`, `ghost`],
      class: `outline-info/25 focus-visible:outline-3`,
    },
    {
      color: `warning`,
      variant: [`soft`, `ghost`],
      class: `outline-warning/25 focus-visible:outline-3`,
    },
    {
      color: `error`,
      variant: [`soft`, `ghost`],
      class: `outline-error/25 focus-visible:outline-3`,
    },
    {
      color: `primary`,
      highlight: true,
      class: `ring ring-inset ring-primary`,
    },
    {
      color: `secondary`,
      highlight: true,
      class: `ring ring-inset ring-secondary`,
    },
    {
      color: `success`,
      highlight: true,
      class: `ring ring-inset ring-success`,
    },
    {
      color: `info`,
      highlight: true,
      class: `ring ring-inset ring-info`,
    },
    {
      color: `warning`,
      highlight: true,
      class: `ring ring-inset ring-warning`,
    },
    {
      color: `error`,
      highlight: true,
      class: `ring ring-inset ring-error`,
    },
    {
      color: `neutral`,
      variant: [`outline`, `subtle`],
      class: `outline-inverted/25 focus-visible:outline-3 focus-visible:ring-inverted`,
    },
    {
      color: `neutral`,
      variant: [`soft`, `ghost`],
      class: `outline-inverted/25 focus-visible:outline-3`,
    },
    {
      color: `neutral`,
      highlight: true,
      class: `ring ring-inset ring-inverted`,
    },
    {
      leading: true,
      size: `xs`,
      class: `ps-7`,
    },
    {
      leading: true,
      size: `sm`,
      class: `ps-8`,
    },
    {
      leading: true,
      size: `md`,
      class: `ps-9`,
    },
    {
      leading: true,
      size: `lg`,
      class: `ps-10`,
    },
    {
      leading: true,
      size: `xl`,
      class: `ps-11`,
    },
    {
      trailing: true,
      size: `xs`,
      class: `pe-7`,
    },
    {
      trailing: true,
      size: `sm`,
      class: `pe-8`,
    },
    {
      trailing: true,
      size: `md`,
      class: `pe-9`,
    },
    {
      trailing: true,
      size: `lg`,
      class: `pe-10`,
    },
    {
      trailing: true,
      size: `xl`,
      class: `pe-11`,
    },
    {
      loading: true,
      leading: true,
      class: {
        leadingIcon: `animate-spin`,
      },
    },
    {
      loading: true,
      leading: false,
      trailing: true,
      class: {
        trailingIcon: `animate-spin`,
      },
    },
    {
      fixed: false,
      size: `xs`,
      class: `md:text-xs`,
    },
    {
      fixed: false,
      size: `sm`,
      class: `md:text-xs`,
    },
    {
      fixed: false,
      size: `md`,
      class: `md:text-sm`,
    },
    {
      fixed: false,
      size: `lg`,
      class: `md:text-sm`,
    },
  ],
  defaultVariants: {
    size: `sm`,
    color: `primary`,
    variant: `outline`,
  },
};
const A = [
  `id`,
  `value`,
  `name`,
  `rows`,
  `placeholder`,
  `disabled`,
  `required`,
];
export const t = {
  inheritAttrs: false,
  ...{
    __name: `UTextarea`,
    props: {
      as: {
        type: null,
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
      placeholder: {
        type: String,
        required: false,
      },
      color: {
        type: null,
        required: false,
      },
      variant: {
        type: null,
        required: false,
      },
      size: {
        type: null,
        required: false,
      },
      required: {
        type: Boolean,
        required: false,
      },
      autofocus: {
        type: Boolean,
        required: false,
      },
      autofocusDelay: {
        type: Number,
        required: false,
        default: 0,
      },
      autoresize: {
        type: Boolean,
        required: false,
      },
      autoresizeDelay: {
        type: Number,
        required: false,
        default: 0,
      },
      disabled: {
        type: Boolean,
        required: false,
      },
      rows: {
        type: Number,
        required: false,
        default: 3,
      },
      maxrows: {
        type: Number,
        required: false,
        default: 0,
      },
      highlight: {
        type: Boolean,
        required: false,
      },
      fixed: {
        type: Boolean,
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
      modelModifiers: {
        type: null,
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
      icon: {
        type: null,
        required: false,
      },
      avatar: {
        type: Object,
        required: false,
      },
      leading: {
        type: Boolean,
        required: false,
      },
      leadingIcon: {
        type: null,
        required: false,
      },
      trailing: {
        type: Boolean,
        required: false,
      },
      trailingIcon: {
        type: null,
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
    },
    emits: [`update:modelValue`, `blur`, `change`],
    setup(g, { expose, emit }) {
      let D = g;
      let O = emit;
      let k = Lt();
      let j = y_2(`textarea`, D);
      let M = g_2(j, `modelValue`, O, {
        defaultValue: j.defaultValue,
      });
      let N = c();
      let {
        emitFormFocus,
        emitFormBlur,
        emitFormInput,
        emitFormChange,
        size,
        color,
        id,
        name,
        highlight,
        disabled,
        ariaAttrs,
      } = m(D, {
        deferInputValidation: true,
      });
      let { isLeading, isTrailing, leadingIconName, trailingIconName } = __2(j);
      let Y = g_1(() =>
        a({
          extend,
          ...(N.ui?.textarea || {}),
        })({
          color: color.value ?? j.color,
          variant: j.variant,
          size: size?.value ?? j.size,
          loading: j.loading,
          highlight: highlight.value ?? j.highlight,
          fixed: j.fixed,
          autoresize: j.autoresize,
          leading: isLeading.value || !!j.avatar || !!k.leading,
          trailing: isTrailing.value || !!k.trailing,
        }),
      );
      let X = Rt(`textareaRef`);
      function Z(e) {
        if (j.modelModifiers?.trim && (typeof e == `string` || e == null)) {
          e = e?.trim() ?? null;
        }
        if (j.modelModifiers?.number) {
          e = w(e);
        }
        if (j.modelModifiers?.nullable) {
          e ||= null;
        }
        if (
          j.modelModifiers?.optional &&
          !j.modelModifiers?.nullable &&
          e !== null
        ) {
          e ||= undefined;
        }
        M.value = e;
        emitFormInput();
      }
      function onInput(e) {
        $();
        if (!j.modelModifiers?.lazy) {
          Z(e.target.value);
        }
      }
      function onChange(e) {
        let value = e.target.value;
        if (j.modelModifiers?.lazy) {
          Z(value);
        }
        if (j.modelModifiers?.trim) {
          e.target.value = value.trim();
        }
        emitFormChange();
        O(`change`, e);
      }
      function onBlur(e) {
        emitFormBlur();
        O(`blur`, e);
      }
      function ae() {
        j.autofocus && X.value?.focus();
      }
      function $() {
        if (j.autoresize && X.value) {
          X.value.rows = j.rows;
          let e = X.value.style.overflow;
          X.value.style.overflow = `hidden`;
          let t = window.getComputedStyle(X.value);
          let n =
            Number.parseInt(t.paddingTop) + Number.parseInt(t.paddingBottom);
          let r = Number.parseInt(t.lineHeight);
          let { scrollHeight: i } = X.value;
          let a = (i - n) / r;
          if (a > j.rows) {
            X.value.rows = j.maxrows ? Math.min(a, j.maxrows) : a;
          }
          X.value.style.overflow = e;
        }
      }
      Ht(M, () => {
        tt($);
      });
      ct(() => {
        setTimeout(() => {
          ae();
        }, j.autofocusDelay);
        setTimeout(async () => {
          await tt();
          $();
        }, j.autoresizeDelay);
      });
      expose({
        textareaRef: X,
        autoResize: $,
      });
      return (e, t) => {
        mt();
        return v(
          On(E_1),
          {
            as: On(j).as,
            "data-slot": e.$attrs[`data-slot`] ?? `root`,
            class: Qn(
              Y.value.root({
                class: [On(j).ui?.root, On(j).class],
              }),
            ),
          },
          {
            default: qt(() => [
              _(
                `textarea`,
                et(
                  {
                    id: On(id),
                    ref_key: `textareaRef`,
                    ref: X,
                    value: On(M),
                    name: On(name),
                    rows: On(j).rows,
                    placeholder: On(j).placeholder,
                    class: Y.value.base({
                      class: On(j).ui?.base,
                    }),
                    disabled: On(disabled),
                    required: On(j).required,
                  },
                  {
                    ...e.$attrs,
                    ...On(ariaAttrs),
                  },
                  {
                    "data-slot": `base`,
                    onInput,
                    onBlur,
                    onChange,
                    onFocus: (t[0] ||= (...e) =>
                      On(emitFormFocus) && On(emitFormFocus)(...e)),
                  },
                ),
                null,
                16,
                A,
              ),
              xt(e.$slots, `default`, {
                ui: Y.value,
              }),
              On(isLeading) || On(j).avatar || k.leading
                ? (mt(),
                  b(
                    `span`,
                    {
                      key: 0,
                      "data-slot": `leading`,
                      class: Qn(
                        Y.value.leading({
                          class: On(j).ui?.leading,
                        }),
                      ),
                    },
                    [
                      xt(
                        e.$slots,
                        `leading`,
                        {
                          ui: Y.value,
                        },
                        () => [
                          On(isLeading) && On(leadingIconName)
                            ? (mt(),
                              v(
                                i,
                                {
                                  key: 0,
                                  name: On(leadingIconName),
                                  "data-slot": `leadingIcon`,
                                  class: Qn(
                                    Y.value.leadingIcon({
                                      class: On(j).ui?.leadingIcon,
                                    }),
                                  ),
                                },
                                null,
                                8,
                                [`name`, `class`],
                              ))
                            : On(j).avatar
                              ? (mt(),
                                v(
                                  n,
                                  et(
                                    {
                                      key: 1,
                                      size:
                                        On(j).ui?.leadingAvatarSize ||
                                        Y.value.leadingAvatarSize(),
                                    },
                                    On(j).avatar,
                                    {
                                      "data-slot": `leadingAvatar`,
                                      class: Y.value.leadingAvatar({
                                        class: On(j).ui?.leadingAvatar,
                                      }),
                                    },
                                  ),
                                  null,
                                  16,
                                  [`size`, `class`],
                                ))
                              : y(``, true),
                        ],
                      ),
                    ],
                    2,
                  ))
                : y(``, true),
              On(isTrailing) || k.trailing
                ? (mt(),
                  b(
                    `span`,
                    {
                      key: 1,
                      "data-slot": `trailing`,
                      class: Qn(
                        Y.value.trailing({
                          class: On(j).ui?.trailing,
                        }),
                      ),
                    },
                    [
                      xt(
                        e.$slots,
                        `trailing`,
                        {
                          ui: Y.value,
                        },
                        () => [
                          On(trailingIconName)
                            ? (mt(),
                              v(
                                i,
                                {
                                  key: 0,
                                  name: On(trailingIconName),
                                  "data-slot": `trailingIcon`,
                                  class: Qn(
                                    Y.value.trailingIcon({
                                      class: On(j).ui?.trailingIcon,
                                    }),
                                  ),
                                },
                                null,
                                8,
                                [`name`, `class`],
                              ))
                            : y(``, true),
                        ],
                      ),
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
export { O as n };
