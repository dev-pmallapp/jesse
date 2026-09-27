import { r } from "./QTnfLwEv.js";
import {
  D,
  E as E_1,
  Ht,
  On,
  Qn,
  _ as __1,
  b as b_1,
  bt,
  g as g_1,
  k,
  mt,
  nr,
  o,
  qt,
  un,
  v as v_1,
  vn,
  y as y_1,
} from "./CoKk4mC0.js";
import { q as q_1 } from "./Cd-sGgPF.js";
import { n as n_1 } from "./2k_QeT3T.js";
import { E as E_2, d, t } from "./B8_r5oP7.js";
import { r as r_2 } from "./BpBaBBm3.js";
import { t as t_2 } from "./6hrdeXKO.js";
import { t as t_3 } from "./Cf85K_3V.js";
import { i, t as t_4 } from "./CJNUlr67.js";
import { t as t_5 } from "./BG8CfSEZ2.js";
import { t as t_6 } from "./JgXkd7uo2.js";
const A = {
  class: `hidden items-center divide-x divide-gray-200 text-xs sm:flex dark:divide-gray-700`,
};
const j = {
  class: `pr-3`,
};
const M = {
  class: `font-bold text-gray-900 dark:text-white`,
};
const N = {
  class: `px-3`,
};
const P = {
  class: `font-bold text-gray-900 dark:text-white`,
};
const F = {
  class: `pl-3`,
};
const te = {
  class: `font-bold text-emerald-600 dark:text-emerald-400`,
};
const ne = {
  class: `grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100 sm:hidden dark:divide-gray-800 dark:border-gray-800`,
};
const I = {
  class: `px-3 py-2.5 text-center`,
};
const L = {
  class: `text-sm font-bold text-gray-900 dark:text-white`,
};
const R = {
  class: `px-3 py-2.5 text-center`,
};
const z = {
  class: `text-sm font-bold text-gray-900 dark:text-white`,
};
const B = {
  class: `px-3 py-2.5 text-center`,
};
const V = {
  class: `text-sm font-bold text-emerald-600 dark:text-emerald-400`,
};
const H = {
  class: `grid gap-4 p-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end`,
};
const U = {
  class: `grid min-w-0 gap-3 sm:grid-cols-2`,
};
const W = {
  class: `grid grid-cols-2 gap-2 sm:flex sm:flex-wrap xl:justify-end`,
};
const G = Object.assign(
  k({
    __name: `BenchmarkToolbar`,
    props: {
      columns: {},
      filters: {},
      sorts: {},
      sort: {},
      resultCount: {},
      finishedCount: {},
      runningCount: {},
      canRerunAll: {
        type: Boolean,
      },
      canRerunFailed: {
        type: Boolean,
      },
      canCancelRunning: {
        type: Boolean,
      },
    },
    emits: [`update:filters`, `update:sort`],
    setup(e, { emit }) {
      let r = e;
      let a = emit;
      let s = d();
      let c = g_1(() => {
        if (r.canRerunAll) {
          return `Rerun every backtest that is not currently running.`;
        }
        if (r.resultCount === 0) {
          return `There are no backtests to rerun.`;
        }
        return `All backtests are currently running.`;
      });
      let u = g_1(() => {
        if (r.canRerunFailed) {
          return `Rerun all failed backtests.`;
        }
        return `There are no failed backtests to rerun.`;
      });
      let p = g_1(() => {
        if (r.canCancelRunning) {
          return `Cancel all running backtests.`;
        }
        return `There are no running backtests to cancel.`;
      });
      let _ = g_1(() =>
        r.columns.map((e) => ({
          label: e.label,
          value: e.key,
        })),
      );
      let v = g_1(() =>
        r.sorts.map((e) => ({
          label: e.label,
          value: e.key,
        })),
      );
      let y = g_1({
        get: () => r.filters.map((e) => e.key),
        set: (e) => {
          a(
            `update:filters`,
            r.columns.filter((t) => e.includes(t.key)),
          );
        },
      });
      let x = g_1({
        get: () => r.sort.key,
        set: (e) => {
          let t = r.sorts.find((t) => t.key === e);
          if (t) {
            a(`update:sort`, t);
          }
        },
      });
      return (n, r) => {
        let a = t_3;
        let l = t_5;
        let S = t_4;
        let C = n_1;
        let w = t_6;
        mt();
        return v_1(
          w,
          {
            title: `Benchmark controls`,
            flush: ``,
            "overflow-hidden": ``,
          },
          {
            header: qt(() => [
              __1(`div`, A, [
                __1(`div`, j, [
                  __1(`span`, M, nr(e.resultCount), 1),
                  (r[2] ||= __1(
                    `span`,
                    {
                      class: `ml-1 text-gray-400`,
                    },
                    `runs`,
                    -1,
                  )),
                ]),
                __1(`div`, N, [
                  __1(`span`, P, nr(e.finishedCount), 1),
                  (r[3] ||= __1(
                    `span`,
                    {
                      class: `ml-1 text-gray-400`,
                    },
                    `finished`,
                    -1,
                  )),
                ]),
                __1(`div`, F, [
                  __1(`span`, te, nr(e.runningCount), 1),
                  (r[4] ||= __1(
                    `span`,
                    {
                      class: `ml-1 text-gray-400`,
                    },
                    `running`,
                    -1,
                  )),
                ]),
              ]),
            ]),
            default: qt(() => [
              __1(`div`, ne, [
                __1(`div`, I, [
                  __1(`div`, L, nr(e.resultCount), 1),
                  (r[5] ||= __1(
                    `div`,
                    {
                      class: `text-[10px] uppercase tracking-wider text-gray-400`,
                    },
                    `Runs`,
                    -1,
                  )),
                ]),
                __1(`div`, R, [
                  __1(`div`, z, nr(e.finishedCount), 1),
                  (r[6] ||= __1(
                    `div`,
                    {
                      class: `text-[10px] uppercase tracking-wider text-gray-400`,
                    },
                    `Finished`,
                    -1,
                  )),
                ]),
                __1(`div`, B, [
                  __1(`div`, V, nr(e.runningCount), 1),
                  (r[7] ||= __1(
                    `div`,
                    {
                      class: `text-[10px] uppercase tracking-wider text-gray-400`,
                    },
                    `Running`,
                    -1,
                  )),
                ]),
              ]),
              __1(`div`, H, [
                __1(`div`, U, [
                  D(
                    l,
                    {
                      label: `Visible metrics`,
                      description: `${e.filters.length} of ${e.columns.length} selected`,
                      class: `min-w-0`,
                    },
                    {
                      default: qt(() => [
                        D(
                          a,
                          {
                            modelValue: On(y),
                            "onUpdate:modelValue": (r[0] ||= (e) => {
                              if (un(y)) {
                                return (y.value = e);
                              }
                              return null;
                            }),
                            items: On(_),
                            "value-key": `value`,
                            multiple: ``,
                            "search-input": {
                              placeholder: `Search metrics…`,
                            },
                            placeholder: `Choose metrics`,
                            class: `w-full min-w-0`,
                          },
                          null,
                          8,
                          [`modelValue`, `items`],
                        ),
                      ]),
                      _: 1,
                    },
                    8,
                    [`description`],
                  ),
                  D(
                    l,
                    {
                      label: `Rank results`,
                      description: `Highest value appears first`,
                      class: `min-w-0`,
                    },
                    {
                      default: qt(() => [
                        D(
                          a,
                          {
                            modelValue: On(x),
                            "onUpdate:modelValue": (r[1] ||= (e) => {
                              if (un(x)) {
                                return (x.value = e);
                              }
                              return null;
                            }),
                            items: On(v),
                            "value-key": `value`,
                            "search-input": false,
                            class: `w-full min-w-0`,
                          },
                          null,
                          8,
                          [`modelValue`, `items`],
                        ),
                      ]),
                      _: 1,
                    },
                  ),
                ]),
                __1(`div`, W, [
                  D(
                    C,
                    {
                      text: On(c),
                      arrow: ``,
                    },
                    {
                      default: qt(() => [
                        D(
                          S,
                          {
                            icon: `i-heroicons-arrow-path`,
                            label: `Rerun all`,
                            class: `w-full justify-center sm:w-auto`,
                            disabled: !e.canRerunAll,
                            onClick: On(s).rerunAll,
                          },
                          null,
                          8,
                          [`disabled`, `onClick`],
                        ),
                      ]),
                      _: 1,
                    },
                    8,
                    [`text`],
                  ),
                  D(
                    C,
                    {
                      text: On(u),
                      arrow: ``,
                    },
                    {
                      default: qt(() => [
                        D(
                          S,
                          {
                            icon: `i-heroicons-exclamation-circle`,
                            color: `error`,
                            variant: `soft`,
                            label: `Rerun failed`,
                            class: `w-full justify-center sm:w-auto`,
                            disabled: !e.canRerunFailed,
                            onClick: On(s).rerunFailed,
                          },
                          null,
                          8,
                          [`disabled`, `onClick`],
                        ),
                      ]),
                      _: 1,
                    },
                    8,
                    [`text`],
                  ),
                  D(
                    C,
                    {
                      text: On(p),
                      arrow: ``,
                      class: `col-span-2`,
                    },
                    {
                      default: qt(() => [
                        D(
                          S,
                          {
                            icon: `i-heroicons-stop`,
                            color: `neutral`,
                            variant: `subtle`,
                            label: `Cancel running`,
                            class: `w-full justify-center sm:w-auto`,
                            disabled: !e.canCancelRunning,
                            onClick: On(s).cancelAllRunning,
                          },
                          null,
                          8,
                          [`disabled`, `onClick`],
                        ),
                      ]),
                      _: 1,
                    },
                    8,
                    [`text`],
                  ),
                ]),
              ]),
            ]),
            _: 1,
          },
        );
      };
    },
  }),
  {
    __name: `BenchmarkToolbar`,
  },
);
const K = {
  class: `flex items-center gap-0.5`,
};
const q = Object.assign(
  k({
    __name: `BenchmarkResultActions`,
    props: {
      result: {},
      resultCount: {},
      routePath: {},
    },
    setup(e) {
      let n = d();
      return (r, a) => {
        let o = t_4;
        let c = n_1;
        mt();
        return b_1(`div`, K, [
          D(
            c,
            {
              text: `Rerun`,
              arrow: ``,
            },
            {
              default: qt(() => [
                D(
                  o,
                  {
                    size: `xs`,
                    variant: `ghost`,
                    icon: `i-heroicons-arrow-path`,
                    disabled: e.result.status === `running`,
                    "aria-label": `Rerun backtest`,
                    onClick: (a[0] ||= (t) => On(n).rerun(e.result.id)),
                  },
                  null,
                  8,
                  [`disabled`],
                ),
              ]),
              _: 1,
            },
          ),
          D(
            c,
            {
              text: `Open backtest`,
              arrow: ``,
            },
            {
              default: qt(() => [
                D(
                  o,
                  {
                    to: `/backtest/${e.result.id}`,
                    size: `xs`,
                    variant: `ghost`,
                    color: `neutral`,
                    icon: `i-heroicons-arrow-top-right-on-square`,
                    "aria-label": `Open backtest`,
                  },
                  null,
                  8,
                  [`to`],
                ),
              ]),
              _: 1,
            },
          ),
          D(
            c,
            {
              text: `Duplicate`,
              arrow: ``,
            },
            {
              default: qt(() => [
                D(o, {
                  size: `xs`,
                  variant: `ghost`,
                  color: `info`,
                  icon: `i-heroicons-document-duplicate`,
                  "aria-label": `Duplicate backtest`,
                  onClick: (a[1] ||= (t) => On(n).duplicateTab(e.result.id)),
                }),
              ]),
              _: 1,
            },
          ),
          D(
            c,
            {
              text: e.result.status === `running` ? `Cancel` : `Close tab`,
              arrow: ``,
            },
            {
              default: qt(() => [
                D(
                  o,
                  {
                    size: `xs`,
                    variant: `ghost`,
                    color: e.result.status === `running` ? `neutral` : `error`,
                    icon:
                      e.result.status === `running`
                        ? `i-heroicons-stop`
                        : `i-heroicons-trash`,
                    "aria-label":
                      e.result.status === `running`
                        ? `Cancel backtest`
                        : `Close backtest`,
                    disabled:
                      e.result.status !== `running` && e.resultCount === 1,
                    onClick: (a[2] ||= (t) => {
                      if (e.result.status === `running`) {
                        return On(n).cancel(e.result.id);
                      }
                      return On(n).closeTab(e.result.id, e.routePath);
                    }),
                  },
                  null,
                  8,
                  [`color`, `icon`, `aria-label`, `disabled`],
                ),
              ]),
              _: 1,
            },
            8,
            [`text`],
          ),
        ]);
      };
    },
  }),
  {
    __name: `BenchmarkResultActions`,
  },
);
const J = {
  class: `space-y-3`,
};
const Y = {
  class: `border-b border-gray-200 px-4 py-3 dark:border-gray-700`,
};
const X = {
  class: `flex flex-wrap items-center justify-between gap-3`,
};
const Z = {
  class: `hidden overflow-auto md:block`,
};
const re = {
  class: `min-w-full border-separate border-spacing-0 text-sm`,
};
const ie = {
  class: `flex items-center gap-3`,
};
const ae = {
  class: `min-w-0`,
};
const oe = {
  class: `truncate font-semibold text-gray-900 dark:text-white`,
};
const se = {
  class: `mt-0.5 flex items-center gap-1.5 text-xs text-gray-400`,
};
const ce = {
  class: `truncate`,
};
const le = {
  class: `divide-y divide-gray-100 md:hidden dark:divide-gray-800`,
};
const ue = {
  class: `flex items-start justify-between gap-3`,
};
const de = {
  class: `flex min-w-0 items-center gap-3`,
};
const fe = {
  class: `flex size-9 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-xs font-bold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300`,
};
const pe = {
  class: `min-w-0`,
};
const me = {
  class: `truncate font-semibold text-gray-900 dark:text-white`,
};
const he = {
  class: `mt-0.5 text-xs text-gray-400`,
};
const ge = {
  class: `mt-4 grid grid-cols-2 gap-2`,
};
const _e = {
  class: `text-[10px] font-semibold uppercase tracking-wider text-gray-400`,
};
const ve = {
  class: `mt-1 truncate text-sm font-semibold text-gray-800 dark:text-gray-200`,
};
const ye = Object.assign(
  k({
    __name: `BenchmarkMatrix`,
    props: {
      results: {},
      columns: {},
      filters: {},
      sorts: {},
      sort: {},
      routePath: {},
    },
    emits: [`update:filters`, `update:sort`],
    setup(e) {
      let n = e;
      let r = d();
      let u = g_1(() => n.results.filter((e) => e.status === `running`).length);
      let h = g_1(
        () => n.results.filter((e) => e.status === `finished`).length,
      );
      let g = g_1(() => n.results.some((e) => e.status !== `running`));
      let _ = g_1(() => n.results.some((e) => e.status === `error`));
      let v = g_1(() => u.value > 0);
      let y = g_1(() =>
        n.filters.filter(
          (e) => ![`strategy`, `symbol`, `timeframe`].includes(e.key),
        ),
      );
      function b(e, t) {
        return e[t];
      }
      function x(e) {
        if (e === `running`) {
          return `bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300`;
        }
        if (e === `error`) {
          return `bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300`;
        }
        return `bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300`;
      }
      function C(e, t) {
        let n = Number.parseFloat(String(t));
        if (Number.isNaN(n)) {
          return ``;
        }
        if (
          [
            `net_profit`,
            `net_profit_percentage`,
            `annual_return`,
            `win_rate`,
          ].includes(e)
        ) {
          if (n >= 0) {
            return `text-emerald-600 dark:text-emerald-400`;
          }
          return `text-rose-600 dark:text-rose-400`;
        }
        return ``;
      }
      return (n, l) => {
        let S = G;
        let w = t_4;
        let T = q;
        let E = t_6;
        mt();
        return b_1(`div`, J, [
          D(
            S,
            {
              columns: e.columns,
              filters: e.filters,
              sorts: e.sorts,
              sort: e.sort,
              "result-count": e.results.length,
              "finished-count": On(h),
              "running-count": On(u),
              "can-rerun-all": On(g),
              "can-rerun-failed": On(_),
              "can-cancel-running": On(v),
              "onUpdate:filters": (l[0] ||= (e) =>
                n.$emit(`update:filters`, e)),
              "onUpdate:sort": (l[1] ||= (e) => n.$emit(`update:sort`, e)),
            },
            null,
            8,
            [
              `columns`,
              `filters`,
              `sorts`,
              `sort`,
              `result-count`,
              `finished-count`,
              `running-count`,
              `can-rerun-all`,
              `can-rerun-failed`,
              `can-cancel-running`,
            ],
          ),
          D(
            E,
            {
              flush: ``,
              "overflow-hidden": ``,
            },
            {
              default: qt(() => [
                __1(`div`, Y, [
                  __1(`div`, X, [
                    (l[3] ||= __1(
                      `div`,
                      null,
                      [
                        __1(
                          `h2`,
                          {
                            class: `text-sm font-semibold text-gray-900 dark:text-white`,
                          },
                          `All benchmark runs`,
                        ),
                        __1(
                          `p`,
                          {
                            class: `mt-0.5 text-xs text-gray-400`,
                          },
                          `Scroll horizontally to inspect every selected metric.`,
                        ),
                      ],
                      -1,
                    )),
                    D(w, {
                      icon: `i-heroicons-plus`,
                      color: `neutral`,
                      variant: `subtle`,
                      label: `New backtest`,
                      size: `sm`,
                      onClick: (l[2] ||= (e) => On(r).addTab()),
                    }),
                  ]),
                ]),
                __1(`div`, Z, [
                  __1(`table`, re, [
                    __1(`thead`, null, [
                      __1(`tr`, null, [
                        (l[4] ||= __1(
                          `th`,
                          {
                            class: `sticky left-0 z-20 min-w-64 border-b border-r border-gray-200 bg-gray-50 px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400`,
                          },
                          ` Backtest `,
                          -1,
                        )),
                        (mt(true),
                        b_1(
                          o,
                          null,
                          bt(On(y), (e) => {
                            mt();
                            return b_1(
                              `th`,
                              {
                                key: e.key,
                                class: `min-w-36 whitespace-nowrap border-b border-gray-200 bg-gray-50 px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400`,
                              },
                              nr(e.label),
                              1,
                            );
                          }),
                          128,
                        )),
                        (l[5] ||= __1(
                          `th`,
                          {
                            class: `sticky right-0 z-20 min-w-32 border-b border-l border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-900`,
                          },
                          null,
                          -1,
                        )),
                      ]),
                    ]),
                    __1(`tbody`, null, [
                      (mt(true),
                      b_1(
                        o,
                        null,
                        bt(e.results, (n, r) => {
                          mt();
                          return b_1(
                            `tr`,
                            {
                              key: n.id,
                              class: `group`,
                            },
                            [
                              __1(
                                `td`,
                                {
                                  class: Qn([
                                    `sticky left-0 z-10 border-b border-r border-gray-100 px-4 py-3 dark:border-gray-800`,
                                    r % 2 == 0
                                      ? `bg-white dark:bg-gray-900`
                                      : `bg-gray-50 dark:bg-gray-900`,
                                  ]),
                                },
                                [
                                  __1(`div`, ie, [
                                    __1(
                                      `div`,
                                      {
                                        class: Qn([
                                          `flex size-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold`,
                                          x(n.status),
                                        ]),
                                      },
                                      nr(String(r + 1).padStart(2, `0`)),
                                      3,
                                    ),
                                    __1(`div`, ae, [
                                      __1(
                                        `div`,
                                        oe,
                                        nr(n.strategy || `Untitled strategy`),
                                        1,
                                      ),
                                      __1(`div`, se, [
                                        __1(
                                          `span`,
                                          ce,
                                          nr(n.symbol || `No symbol`),
                                          1,
                                        ),
                                        (l[6] ||= __1(`span`, null, `·`, -1)),
                                        __1(
                                          `span`,
                                          null,
                                          nr(n.timeframe || `-`),
                                          1,
                                        ),
                                      ]),
                                    ]),
                                  ]),
                                ],
                                2,
                              ),
                              (mt(true),
                              b_1(
                                o,
                                null,
                                bt(On(y), (e) => {
                                  mt();
                                  return b_1(
                                    `td`,
                                    {
                                      key: e.key,
                                      class: Qn([
                                        `whitespace-nowrap border-b border-gray-100 px-4 py-3 text-right font-medium text-gray-700 dark:border-gray-800 dark:text-gray-300`,
                                        r % 2 == 0
                                          ? `bg-white dark:bg-gray-900`
                                          : `bg-gray-50/80 dark:bg-gray-900`,
                                      ]),
                                    },
                                    [
                                      __1(
                                        `span`,
                                        {
                                          class: Qn(C(e.key, b(n, e.key))),
                                        },
                                        nr(b(n, e.key) || `—`),
                                        3,
                                      ),
                                    ],
                                    2,
                                  );
                                }),
                                128,
                              )),
                              __1(
                                `td`,
                                {
                                  class: Qn([
                                    `sticky right-0 z-10 border-b border-l border-gray-100 px-3 py-3 dark:border-gray-800`,
                                    r % 2 == 0
                                      ? `bg-white dark:bg-gray-900`
                                      : `bg-gray-50 dark:bg-gray-900`,
                                  ]),
                                },
                                [
                                  D(
                                    T,
                                    {
                                      result: n,
                                      "result-count": e.results.length,
                                      "route-path": e.routePath,
                                    },
                                    null,
                                    8,
                                    [`result`, `result-count`, `route-path`],
                                  ),
                                ],
                                2,
                              ),
                            ],
                          );
                        }),
                        128,
                      )),
                    ]),
                  ]),
                ]),
                __1(`div`, le, [
                  (mt(true),
                  b_1(
                    o,
                    null,
                    bt(e.results, (n, r) => {
                      mt();
                      return b_1(
                        `article`,
                        {
                          key: n.id,
                          class: `p-4`,
                        },
                        [
                          __1(`div`, ue, [
                            __1(`div`, de, [
                              __1(`div`, fe, nr(r + 1), 1),
                              __1(`div`, pe, [
                                __1(
                                  `h3`,
                                  me,
                                  nr(n.strategy || `Untitled strategy`),
                                  1,
                                ),
                                __1(
                                  `p`,
                                  he,
                                  nr(n.symbol) + ` · ` + nr(n.timeframe),
                                  1,
                                ),
                              ]),
                            ]),
                            D(
                              T,
                              {
                                result: n,
                                "result-count": e.results.length,
                                "route-path": e.routePath,
                              },
                              null,
                              8,
                              [`result`, `result-count`, `route-path`],
                            ),
                          ]),
                          __1(`dl`, ge, [
                            (mt(true),
                            b_1(
                              o,
                              null,
                              bt(On(y).slice(0, 6), (e) => {
                                mt();
                                return b_1(
                                  `div`,
                                  {
                                    key: e.key,
                                    class: `rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-800/70`,
                                  },
                                  [
                                    __1(`dt`, _e, nr(e.label), 1),
                                    __1(`dd`, ve, nr(b(n, e.key) || `—`), 1),
                                  ],
                                );
                              }),
                              128,
                            )),
                          ]),
                        ],
                      );
                    }),
                    128,
                  )),
                ]),
              ]),
              _: 1,
            },
          ),
        ]);
      };
    },
  }),
  {
    __name: `BenchmarkMatrix`,
  },
);
const Q = r(E_2(), 1);
const be = {
  class: `w-full`,
};
const xe = {
  class: `flex-1 p-3`,
};
const Se = {
  key: 0,
  class: `relative min-h-[42rem] overflow-hidden rounded-2xl border border-gray-200 bg-gray-100/70 p-2 shadow-sm dark:border-gray-800 dark:bg-gray-950 sm:p-3`,
};
const Ce = {
  class: `grid select-none gap-3 opacity-35 blur-[5px] sm:grid-cols-2 xl:grid-cols-3`,
  "aria-hidden": `true`,
};
const we = {
  class: `flex items-center justify-between`,
};
const Te = {
  class: `flex size-9 items-center justify-center rounded-xl bg-gray-200 text-xs font-bold text-gray-500 dark:bg-gray-800`,
};
const Ee = {
  class: `mt-7 grid grid-cols-2 gap-2`,
};
const De = {
  class: `mt-2 text-lg font-bold text-gray-500`,
};
const $ = {
  class: `absolute inset-0 flex items-center justify-center p-4`,
};
const Oe = {
  class: `px-4 py-5 text-center sm:px-8 sm:py-8`,
};
const ke = {
  class: `mt-5 text-2xl font-bold tracking-tight text-gray-950 dark:text-white`,
};
const Ae = {
  class: `mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500 dark:text-gray-400`,
};
const je = {
  key: 0,
  class: `mt-5 rounded-xl bg-gray-950 p-4 text-left`,
};
const Me = {
  class: `mt-6 flex flex-col justify-center gap-2 sm:flex-row`,
};
const Ne = {
  key: 1,
  class: `rounded-2xl border border-gray-200 bg-gray-100/70 p-2 shadow-sm dark:border-gray-800 dark:bg-gray-950 sm:p-3`,
  "data-testid": `benchmark-workspace`,
};
const Pe = k({
  __name: `benchmark`,
  setup(e) {
    r_2({
      title: `Benchmark`,
    });
    let u = d();
    let h = t();
    let g = q_1();
    let b = g_1(() => u.tabs);
    let x = g_1(() => h.plan === `free` || h.plan === `guest`);
    let E = [
      {
        symbol: `ETH-USDT`,
        values: [`+47.3%`, `-18.4%`, `1.84`, `58.2%`],
      },
      {
        symbol: `BTC-USDT`,
        values: [`+28.9%`, `-12.1%`, `1.32`, `51.7%`],
      },
      {
        symbol: `SOL-USDT`,
        values: [`+63.1%`, `-24.7%`, `2.11`, `62.4%`],
      },
      {
        symbol: `BNB-USDT`,
        values: [`+15.4%`, `-9.3%`, `0.97`, `48.9%`],
      },
      {
        symbol: `AVAX-USDT`,
        values: [`+34.7%`, `-16.2%`, `1.51`, `55.3%`],
      },
      {
        symbol: `ARB-USDT`,
        values: [`+21.6%`, `-13.8%`, `1.18`, `52.8%`],
      },
    ];
    let O = vn(u.benchmarkColumns);
    let A = vn(u.benchmarkSorts);
    if (u.benchmarkFilters.length === 0) {
      u.setBenchmarkFilters(O.value);
    }
    let j = vn(JSON.parse(JSON.stringify(u.benchmarkFilters)));
    if (Object.keys(u.benchmarkSelectedSort).length === 0) {
      u.setBenchmarkSort(A.value[0]);
    }
    let M = vn(u.benchmarkSelectedSort);
    let N = g_1(() => {
      let e = [];
      for (let t in u.tabs) {
        let n = u.tabs[t];
        let r = {
          id: n.id,
          strategy: n.form.routes[0]?.strategy ?? ``,
          start_date: n.form.start_date,
          finish_date: n.form.finish_date,
          fast_mode: n.form.fast_mode,
          exchange: n.form.exchange,
          symbol: n.form.routes[0]?.symbol ?? ``,
          timeframe: n.form.routes[0]?.timeframe ?? ``,
        };
        let i = n.results.metrics;
        if (Object.keys(i).length > 0) {
          r.total_closed_trades = i.total;
          r.net_profit = Q.default.round(i.net_profit, 1);
          r.net_profit_percentage = `${Q.default.round(i.net_profit_percentage, 1)} %`;
          r.total_paid_fees = Q.default.round(i.fee, 1);
          r.max_drawdown = `${Q.default.round(i.max_drawdown, 1)} %`;
          r.annual_return = `${Q.default.round(i.annual_return, 1)} %`;
          r.expectancy = `${Q.default.round(i.expectancy_percentage, 1)} %`;
          r.ratio_avg_win_loss = Q.default.round(i.ratio_avg_win_loss, 1);
          r.win_rate = `${Q.default.round(i.win_rate * 100, 1)} %`;
          r.longs_percentage = `${Q.default.round(i.longs_percentage, 1)} %`;
          r.shorts_percentage = `${Q.default.round(i.shorts_percentage, 1)} %`;
          r.average_holding_hours = Q.default.round(
            i.average_holding_period / 3600,
            1,
          );
          r.sharpe_ratio = Q.default.round(i.sharpe_ratio, 1);
          r.sortino_ratio = Q.default.round(i.sortino_ratio, 1);
          r.calmar_ratio = Q.default.round(i.calmar_ratio, 1);
          r.omega_ratio = Q.default.round(i.omega_ratio, 1);
        }
        if (n.results.executing && !n.results.exception.error) {
          r.progress = `${n.results.progressbar.current}%`;
          r.status = `running`;
        } else if (n.results.exception.error && n.results.executing) {
          r.progress = `Failed`;
          r.status = `error`;
        } else if (Object.keys(i).length === 0) {
          r.status = ``;
        } else {
          r.progress = `Ready`;
          r.status = `finished`;
        }
        e.push(r);
      }
      return e;
    });
    function P(e, t) {
      return e[t];
    }
    let F = g_1(() => {
      if (M.value.key === `none`) {
        return N.value;
      }
      return [...N.value].sort((e, t) => {
        let n = Number.parseFloat(String(P(e, M.value.key)));
        let r = Number.parseFloat(String(P(t, M.value.key)));
        let i = Number.isNaN(n);
        let a = Number.isNaN(r);
        if (i && a) {
          return 0;
        }
        if (i) {
          return 1;
        }
        if (a) {
          return -1;
        }
        return r - n;
      });
    });
    Ht(
      j,
      (e) => {
        e.sort(
          (e, t) =>
            O.value.findIndex((t) => t.key === e.key) -
            O.value.findIndex((e) => e.key === t.key),
        );
        u.setBenchmarkFilters(e);
      },
      {
        deep: true,
      },
    );
    Ht(M, (e) => u.setBenchmarkSort(e), {
      deep: true,
    });
    return (e, r) => {
      let l = t_2;
      let _ = i;
      let y = t_4;
      let S = t_6;
      let C = ye;
      mt();
      return b_1(
        o,
        null,
        [
          __1(`div`, be, [
            D(
              l,
              {
                "current-tab": null,
                tabs: b.value,
                onClose: (r[0] ||= (e) => On(u).closeTab(e, On(g).path)),
              },
              null,
              8,
              [`tabs`],
            ),
          ]),
          __1(`main`, xe, [
            x.value
              ? (mt(),
                b_1(`div`, Se, [
                  __1(`div`, Ce, [
                    (mt(),
                    b_1(
                      o,
                      null,
                      bt(E, (e, t) =>
                        __1(
                          `div`,
                          {
                            key: e.symbol,
                            class: `rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900`,
                          },
                          [
                            __1(`div`, we, [
                              (r[3] ||= __1(
                                `div`,
                                null,
                                [
                                  __1(`div`, {
                                    class: `h-3 w-28 rounded-full bg-gray-300 dark:bg-gray-700`,
                                  }),
                                  __1(`div`, {
                                    class: `mt-2 h-2 w-16 rounded-full bg-gray-200 dark:bg-gray-800`,
                                  }),
                                ],
                                -1,
                              )),
                              __1(`div`, Te, nr(t + 1), 1),
                            ]),
                            __1(`div`, Ee, [
                              (mt(true),
                              b_1(
                                o,
                                null,
                                bt(e.values, (e) => {
                                  mt();
                                  return b_1(
                                    `div`,
                                    {
                                      key: e,
                                      class: `rounded-xl bg-gray-50 p-3 dark:bg-gray-800/60`,
                                    },
                                    [
                                      (r[4] ||= __1(
                                        `div`,
                                        {
                                          class: `h-2 w-12 rounded-full bg-gray-200 dark:bg-gray-700`,
                                        },
                                        null,
                                        -1,
                                      )),
                                      __1(`div`, De, nr(e), 1),
                                    ],
                                  );
                                }),
                                128,
                              )),
                            ]),
                          ],
                        ),
                      ),
                      64,
                    )),
                  ]),
                  __1(`div`, $, [
                    D(
                      S,
                      {
                        class: `w-full max-w-lg`,
                        "overflow-hidden": ``,
                      },
                      {
                        default: qt(() => [
                          __1(`div`, Oe, [
                            __1(
                              `div`,
                              {
                                class: Qn([
                                  `mx-auto flex size-14 items-center justify-center rounded-2xl`,
                                  On(h).plan === `guest`
                                    ? `bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300`
                                    : `bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300`,
                                ]),
                              },
                              [
                                D(
                                  _,
                                  {
                                    name:
                                      On(h).plan === `guest`
                                        ? `i-heroicons-key`
                                        : `i-heroicons-sparkles`,
                                    class: `size-7`,
                                  },
                                  null,
                                  8,
                                  [`name`],
                                ),
                              ],
                              2,
                            ),
                            __1(
                              `h1`,
                              ke,
                              nr(
                                On(h).plan === `guest`
                                  ? `Connect your Jesse license`
                                  : `Benchmark is a Premium feature`,
                              ),
                              1,
                            ),
                            __1(`p`, Ae, [
                              On(h).plan === `guest`
                                ? (mt(),
                                  b_1(
                                    o,
                                    {
                                      key: 0,
                                    },
                                    [
                                      E_1(
                                        ` Add your jesse.trade license token to compare runs, rank strategies, and manage batch operations from one research workspace. `,
                                      ),
                                    ],
                                    64,
                                  ))
                                : (mt(),
                                  b_1(
                                    o,
                                    {
                                      key: 1,
                                    },
                                    [
                                      E_1(
                                        ` Compare every backtest side-by-side, surface your strongest strategy, and rerun or duplicate experiments in seconds. `,
                                      ),
                                    ],
                                    64,
                                  )),
                            ]),
                            On(h).plan === `guest`
                              ? (mt(),
                                b_1(`div`, je, [
                                  ...(r[5] ||= [
                                    __1(
                                      `div`,
                                      {
                                        class: `text-[10px] font-bold uppercase tracking-wider text-gray-500`,
                                      },
                                      `Your .env file`,
                                      -1,
                                    ),
                                    __1(
                                      `code`,
                                      {
                                        class: `mt-2 block overflow-x-auto text-xs text-emerald-400`,
                                      },
                                      `LICENSE_API_TOKEN=your-token-here`,
                                      -1,
                                    ),
                                  ]),
                                ]))
                              : y_1(``, true),
                            __1(`div`, Me, [
                              D(
                                y,
                                {
                                  to:
                                    On(h).plan === `guest`
                                      ? `https://jesse.trade/user/api-tokens`
                                      : `https://jesse.trade/pricing`,
                                  target: `_blank`,
                                  size: `lg`,
                                  icon:
                                    On(h).plan === `guest`
                                      ? `i-heroicons-key`
                                      : `i-heroicons-arrow-up-right`,
                                  label:
                                    On(h).plan === `guest`
                                      ? `Get license token`
                                      : `View Premium plans`,
                                },
                                null,
                                8,
                                [`to`, `icon`, `label`],
                              ),
                              D(y, {
                                to: `https://docs.jesse.trade/docs/benchmark/`,
                                target: `_blank`,
                                size: `lg`,
                                color: `neutral`,
                                variant: `subtle`,
                                icon: `i-heroicons-book-open`,
                                label: `Read the guide`,
                              }),
                            ]),
                          ]),
                        ]),
                        _: 1,
                      },
                    ),
                  ]),
                ]))
              : (mt(),
                b_1(`div`, Ne, [
                  D(
                    C,
                    {
                      results: F.value,
                      columns: O.value,
                      filters: j.value,
                      sorts: A.value,
                      sort: M.value,
                      "route-path": On(g).path,
                      "onUpdate:filters": (r[1] ||= (e) => (j.value = e)),
                      "onUpdate:sort": (r[2] ||= (e) => (M.value = e)),
                    },
                    null,
                    8,
                    [
                      `results`,
                      `columns`,
                      `filters`,
                      `sorts`,
                      `sort`,
                      `route-path`,
                    ],
                  ),
                ])),
          ]),
        ],
        64,
      );
    };
  },
});
export { Pe as default };
