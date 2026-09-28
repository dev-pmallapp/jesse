import {
  $,
  D,
  E,
  Ft,
  On,
  Qn,
  _ as __1,
  b as b_1,
  g as g_1,
  gn,
  k as k_1,
  mt,
  nr,
  o,
  qt,
  v,
  vn,
  wt,
  xt,
  y,
} from "./CoKk4mC0.js";
import { Et, ot } from "./Cd-sGgPF.js";
import { t as t_1 } from "./2k_QeT3T.js";
import { O as O_1, S, t as t_2, w } from "./B8_r5oP7.js";
import { t as t_3 } from "./CQRhyXHt.js";
import { t as t_4 } from "./C96bnRGM.js";
import { i, t as t_5 } from "./CJNUlr67.js";
import { t as t_6 } from "./BG8CfSEZ2.js";
import { t as t_7 } from "./BqJ9I9M42.js";
import { t as t_8 } from "./TtSlr_h_2.js";
import { t as t_9 } from "./OfUAv67B2.js";
const O = {
  class: `flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50/80 p-4 dark:border-gray-700 dark:bg-gray-800/50`,
};
const k = {
  class: `flex size-9 shrink-0 items-center justify-center rounded-lg bg-white text-indigo-500 shadow-xs ring-1 ring-gray-200 dark:bg-gray-900 dark:text-indigo-400 dark:ring-gray-700`,
};
const A = {
  key: 0,
  class: `mt-3 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50/70 px-3.5 py-3 dark:border-amber-900/70 dark:bg-amber-950/30`,
};
const j = {
  class: `overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700`,
};
const M = [`aria-expanded`];
const N = {
  class: `flex min-w-0 items-center gap-3`,
};
const P = {
  class: `flex size-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400`,
};
const F = {
  class: `min-w-0`,
};
const I = {
  class: `block truncate text-xs text-gray-400 dark:text-gray-500`,
};
const L = {
  class: `flex shrink-0 items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500`,
};
const R = {
  key: 0,
  class: `border-t border-gray-100 bg-gray-50/70 p-3 dark:border-gray-800 dark:bg-gray-950/40`,
};
const z = {
  class: `max-h-56 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-gray-800 bg-gray-950 p-3.5 font-mono text-xs leading-5 text-gray-200`,
};
const B = {
  class: `flex items-center justify-end gap-2 pt-1`,
};
const V = {
  role: `alert`,
  class: `select-text overflow-hidden rounded-xl border border-rose-200/80 bg-white shadow-xs dark:border-rose-900/70 dark:bg-gray-900`,
};
const H = {
  class: `flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5`,
};
const U = {
  class: `flex min-w-0 gap-3.5`,
};
const W = {
  class: `flex size-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-500 ring-1 ring-inset ring-rose-100 dark:bg-rose-950/50 dark:text-rose-400 dark:ring-rose-900`,
};
const G = {
  class: `min-w-0 pt-0.5`,
};
const K = {
  class: `mt-1 text-sm font-semibold leading-6 text-gray-900 dark:text-white`,
};
const se = {
  key: 0,
  class: `mt-1 text-sm leading-5 text-gray-500 dark:text-gray-400`,
};
const ce = {
  class: `grid w-full shrink-0 grid-cols-2 gap-2 sm:flex sm:w-auto sm:self-start`,
};
const le = {
  key: 0,
  class: `border-t border-gray-100 bg-gray-50/70 dark:border-gray-800 dark:bg-gray-950/40`,
};
const ue = [`aria-expanded`];
const de = {
  class: `flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-gray-300`,
};
const fe = {
  class: `flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500`,
};
const pe = {
  key: 0,
  class: `px-4 pb-4 sm:px-5 sm:pb-5`,
};
const me = {
  class: `max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-gray-800 bg-gray-950 p-4 font-mono text-xs leading-5 text-gray-200 shadow-inner`,
};
export const n = Object.assign(
  k_1({
    __name: `Exception`,
    props: $(
      {
        title: String,
        content: {
          type: String,
          default: ``,
        },
        mode: String,
        debugMode: {
          type: Boolean,
          default: false,
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
      let u = e;
      let g = Ft(e, `modelValue`);
      let _ = g_1(() => ot().params.id);
      let T = t_2();
      let q = gn({
        description: ``,
        attachLogs: true,
        email: ``,
      });
      let J = vn(false);
      let Y = vn(false);
      let X = vn(false);
      let Z = vn(false);
      let Q = g_1(() => {
        if (!u.content) {
          return ``;
        }
        let e =
          u.content
            .split(
              `
`,
            )
            .map((e) => e.trim())
            .filter(Boolean)
            .at(-1) || ``;
        let t = e.indexOf(`: `);
        let n = t >= 0 ? e.slice(t + 2) : e;
        if (n === u.title) {
          return ``;
        }
        return n;
      });
      let he = g_1(() => u.mode === `backtest` && !u.debugMode);
      let ge = g_1(
        () => (u.mode === `backtest` && u.debugMode) || u.mode === `live`,
      );
      let $ = g_1(() => T.hasLivePluginInstalled);
      let onSubmit = async () => {
        Z.value = true;
        let { data, error } = await S(`/system/report-exception`, {
          method: `POST`,
          body: {
            description: q.description,
            email: q.email,
            traceback: u.content,
            mode: u.mode,
            attach_logs: q.attachLogs,
            session_id: _.value,
          },
          authenticated: true,
        });
        Z.value = false;
        if (error.value && error.value.statusCode !== 200) {
          O_1(`error`, `[${error.value.statusCode}]: ${error.value.message}`);
          return;
        }
        let data_value = data.value;
        if (data_value.status === `success`) {
          q.description = ``;
          q.email = ``;
          O_1(`success`, data_value.message);
          g.value = false;
        } else if (data_value.status === `error`) {
          O_1(`error`, data_value.message);
        }
      };
      let ve = async () => {
        let e = [u.title, u.content].filter(Boolean).join(`

`);
        if (!(await w.copyToClipboard(e)).success) {
          O_1(`error`, `Failed to copy exception`);
          return;
        }
        O_1(`success`, `Copied successfully`);
        X.value = true;
        setTimeout(() => {
          X.value = false;
        }, 2000);
      };
      let ye = () => {
        g.value = true;
      };
      return (r, c) => {
        let l = i;
        let u = t_4;
        let h = t_6;
        let _ = t_1;
        let b = t_7;
        let x = t_5;
        let S = t_8;
        let C = t_9;
        mt();
        return b_1(
          o,
          null,
          [
            D(
              C,
              {
                modelValue: g.value,
                "onUpdate:modelValue": (c[5] ||= (e) => (g.value = e)),
                title: `Report an issue`,
                size: `small`,
              },
              {
                default: qt(() => [
                  __1(`div`, O, [
                    __1(`div`, k, [
                      D(l, {
                        name: `i-heroicons-chat-bubble-left-ellipsis`,
                        class: `size-5`,
                      }),
                    ]),
                    (c[7] ||= __1(
                      `div`,
                      null,
                      [
                        __1(
                          `p`,
                          {
                            class: `text-sm font-semibold text-gray-900 dark:text-white`,
                          },
                          `Help us understand what happened`,
                        ),
                        __1(
                          `p`,
                          {
                            class: `mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400`,
                          },
                          ` Add any context that could help us reproduce the issue. The exception details are included automatically. `,
                        ),
                      ],
                      -1,
                    )),
                  ]),
                  On(he)
                    ? (mt(),
                      b_1(`div`, A, [
                        D(l, {
                          name: `i-heroicons-light-bulb`,
                          class: `mt-0.5 size-4 shrink-0 text-amber-500 dark:text-amber-400`,
                        }),
                        (c[8] ||= __1(
                          `div`,
                          null,
                          [
                            __1(
                              `p`,
                              {
                                class: `text-xs font-semibold text-amber-900 dark:text-amber-200`,
                              },
                              `Debug logs are not available for this run`,
                            ),
                            __1(
                              `p`,
                              {
                                class: `mt-0.5 text-xs leading-5 text-amber-700 dark:text-amber-300/80`,
                              },
                              ` For a more useful report, rerun the backtest with Debug Mode enabled so its logs can be attached. `,
                            ),
                          ],
                          -1,
                        )),
                      ]))
                    : y(``, true),
                  D(
                    S,
                    {
                      state: On(q),
                      class: `mt-5 space-y-5`,
                      onSubmit,
                    },
                    {
                      default: qt(() => [
                        D(
                          h,
                          {
                            label: `What were you doing?`,
                            name: `description`,
                            help: `Optional, but even one sentence can make the issue much easier to reproduce.`,
                          },
                          {
                            default: qt(() => [
                              D(
                                u,
                                {
                                  modelValue: On(q).description,
                                  "onUpdate:modelValue": (c[0] ||= (e) =>
                                    (On(q).description = e)),
                                  rows: 6,
                                  placeholder: `Describe what happened just before the error...`,
                                },
                                null,
                                8,
                                [`modelValue`],
                              ),
                            ]),
                            _: 1,
                          },
                        ),
                        On($)
                          ? y(``, true)
                          : (mt(),
                            v(
                              h,
                              {
                                key: 0,
                                label: `Jesse.Trade account email`,
                                help: `Enter the email address connected to your Jesse.Trade account so we know who sent the report and can follow up.`,
                                required: ``,
                              },
                              {
                                default: qt(() => [
                                  D(
                                    _,
                                    {
                                      modelValue: On(q).email,
                                      "onUpdate:modelValue": (c[1] ||= (e) =>
                                        (On(q).email = e)),
                                      placeholder: `Email address...`,
                                      type: `email`,
                                    },
                                    null,
                                    8,
                                    [`modelValue`],
                                  ),
                                ]),
                                _: 1,
                              },
                            )),
                        On(ge)
                          ? (mt(),
                            v(
                              b,
                              {
                                key: 1,
                                modelValue: On(q).attachLogs,
                                "onUpdate:modelValue": (c[2] ||= (e) =>
                                  (On(q).attachLogs = e)),
                                title: `Attach Debugging Logs`,
                                help: `Attach the log file of this session along with this report which helps Jesse's team`,
                              },
                              null,
                              8,
                              [`modelValue`],
                            ))
                          : y(``, true),
                        __1(`div`, j, [
                          __1(
                            `button`,
                            {
                              type: `button`,
                              class: `flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500 dark:hover:bg-gray-800/60`,
                              "aria-expanded": On(Y),
                              onClick: (c[3] ||= (e) => (Y.value = !On(Y))),
                            },
                            [
                              __1(`span`, N, [
                                __1(`span`, P, [
                                  D(l, {
                                    name: `i-heroicons-code-bracket-square`,
                                    class: `size-4`,
                                  }),
                                ]),
                                __1(`span`, F, [
                                  (c[9] ||= __1(
                                    `span`,
                                    {
                                      class: `block text-xs font-semibold text-gray-800 dark:text-gray-200`,
                                    },
                                    `Exception attached`,
                                    -1,
                                  )),
                                  __1(
                                    `span`,
                                    I,
                                    nr(e.title || `Technical details`),
                                    1,
                                  ),
                                ]),
                              ]),
                              __1(`span`, L, [
                                E(nr(On(Y) ? `Hide` : `Review`) + ` `, 1),
                                D(
                                  l,
                                  {
                                    name: `i-heroicons-chevron-down`,
                                    class: Qn([
                                      `size-4 transition-transform duration-200`,
                                      On(Y) ? `rotate-180` : ``,
                                    ]),
                                  },
                                  null,
                                  8,
                                  [`class`],
                                ),
                              ]),
                            ],
                            8,
                            M,
                          ),
                          D(
                            Et,
                            {
                              "enter-active-class": `transition duration-200 ease-out`,
                              "enter-from-class": `-translate-y-1 opacity-0`,
                              "leave-active-class": `transition duration-150 ease-in`,
                              "leave-to-class": `-translate-y-1 opacity-0`,
                            },
                            {
                              default: qt(() => [
                                On(Y)
                                  ? (mt(),
                                    b_1(`div`, R, [
                                      __1(`pre`, z, nr(e.content), 1),
                                    ]))
                                  : y(``, true),
                              ]),
                              _: 1,
                            },
                          ),
                        ]),
                        __1(`div`, B, [
                          D(x, {
                            id: `feedback-cancel-button`,
                            color: `neutral`,
                            variant: `ghost`,
                            label: `Cancel`,
                            onClick: (c[4] ||= (e) => (g.value = false)),
                          }),
                          D(
                            x,
                            {
                              id: `feedback-submit-button`,
                              type: `submit`,
                              icon: `i-heroicons-paper-airplane`,
                              class: `flex min-w-36 justify-center`,
                              label: `Send report`,
                              loading: On(Z),
                              disabled: !On(q).email.length && !On($),
                            },
                            null,
                            8,
                            [`loading`, `disabled`],
                          ),
                        ]),
                      ]),
                      _: 1,
                    },
                    8,
                    [`state`],
                  ),
                ]),
                _: 1,
              },
              8,
              [`modelValue`],
            ),
            __1(`section`, V, [
              __1(`div`, H, [
                __1(`div`, U, [
                  __1(`div`, W, [
                    D(l, {
                      name: `i-heroicons-exclamation-triangle`,
                      class: `size-5`,
                    }),
                  ]),
                  __1(`div`, G, [
                    (c[10] ||= __1(
                      `p`,
                      {
                        class: `text-[11px] font-semibold uppercase tracking-[0.14em] text-rose-500 dark:text-rose-400`,
                      },
                      ` Session stopped `,
                      -1,
                    )),
                    __1(`h3`, K, nr(e.title || `Something went wrong`), 1),
                    On(Q) ? (mt(), b_1(`p`, se, nr(On(Q)), 1)) : y(``, true),
                  ]),
                ]),
                __1(`div`, ce, [
                  D(x, {
                    color: `error`,
                    variant: `soft`,
                    size: `sm`,
                    icon: `i-heroicons-flag`,
                    label: `Report`,
                    class: `justify-center sm:min-w-24`,
                    onClick: ye,
                  }),
                  D(
                    x,
                    {
                      color: On(X) ? `success` : `neutral`,
                      variant: `outline`,
                      size: `sm`,
                      icon: On(X)
                        ? `i-heroicons-check`
                        : `i-heroicons-clipboard-document`,
                      label: On(X) ? `Copied` : `Copy`,
                      class: `justify-center bg-white sm:min-w-24 dark:bg-gray-900`,
                      onClick: ve,
                    },
                    null,
                    8,
                    [`color`, `icon`, `label`],
                  ),
                ]),
              ]),
              e.content
                ? (mt(),
                  b_1(`div`, le, [
                    __1(
                      `button`,
                      {
                        type: `button`,
                        class: `flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-100/70 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500 dark:hover:bg-gray-800/50 sm:px-5`,
                        "aria-expanded": On(J),
                        onClick: (c[6] ||= (e) => (J.value = !On(J))),
                      },
                      [
                        __1(`span`, de, [
                          D(l, {
                            name: `i-heroicons-code-bracket-square`,
                            class: `size-4 text-gray-400 dark:text-gray-500`,
                          }),
                          (c[11] ||= E(` Technical details `, -1)),
                        ]),
                        __1(`span`, fe, [
                          E(nr(On(J) ? `Hide` : `Show traceback`) + ` `, 1),
                          D(
                            l,
                            {
                              name: `i-heroicons-chevron-down`,
                              class: Qn([
                                `size-4 transition-transform duration-200`,
                                On(J) ? `rotate-180` : ``,
                              ]),
                            },
                            null,
                            8,
                            [`class`],
                          ),
                        ]),
                      ],
                      8,
                      ue,
                    ),
                    D(
                      Et,
                      {
                        "enter-active-class": `transition duration-200 ease-out`,
                        "enter-from-class": `-translate-y-1 opacity-0`,
                        "leave-active-class": `transition duration-150 ease-in`,
                        "leave-to-class": `-translate-y-1 opacity-0`,
                      },
                      {
                        default: qt(() => [
                          On(J)
                            ? (mt(),
                              b_1(`div`, pe, [
                                __1(`pre`, me, nr(e.content), 1),
                              ]))
                            : y(``, true),
                        ]),
                        _: 1,
                      },
                    ),
                  ]))
                : y(``, true),
            ]),
          ],
          64,
        );
      };
    },
  }),
  {
    __name: `Exception`,
  },
);
const J = {
  class: `flex-1 truncate text-sm font-medium text-gray-700 dark:text-gray-200`,
};
export const t = Object.assign(
  k_1({
    __name: `ActionListItem`,
    props: {
      label: {},
      icon: {},
      iconClass: {},
      to: {},
      href: {},
      target: {
        default: `_blank`,
      },
      trailing: {
        type: Boolean,
        default: true,
      },
    },
    emits: [`click`],
    setup(e) {
      let n = e;
      let r = g_1(() => {
        if (n.to) {
          return t_3;
        }
        if (n.href) {
          return `a`;
        }
        return `button`;
      });
      return (n, s) => {
        let c = i;
        mt();
        return v(
          wt(On(r)),
          {
            to: e.to || undefined,
            href: e.href || undefined,
            target: e.href ? e.target : undefined,
            type: On(r) === `button` ? `button` : undefined,
            class: `flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/60`,
            onClick: (s[0] ||= (e) => n.$emit(`click`, e)),
          },
          {
            default: qt(() => [
              D(
                c,
                {
                  name: e.icon,
                  class: Qn([
                    `size-4 shrink-0`,
                    e.iconClass || `text-gray-400 dark:text-gray-500`,
                  ]),
                },
                null,
                8,
                [`name`, `class`],
              ),
              __1(`span`, J, nr(e.label), 1),
              xt(n.$slots, `trailing`, {}, () => [
                e.trailing
                  ? (mt(),
                    v(c, {
                      key: 0,
                      name: `i-heroicons-chevron-right`,
                      class: `size-3.5 shrink-0 text-gray-300 dark:text-gray-600`,
                    }))
                  : y(``, true),
              ]),
            ]),
            _: 3,
          },
          8,
          [`to`, `href`, `target`, `type`],
        );
      };
    },
  }),
  {
    __name: `ActionListItem`,
  },
);
