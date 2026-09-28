import {
  D,
  Ht,
  On,
  _ as __1,
  b,
  ct,
  g,
  k as k_1,
  mt,
  nr,
  qt,
  v as v_1,
  vn,
  y as y_1,
} from "./CoKk4mC0.js";
import { st } from "./Cd-sGgPF.js";
import { t as t_1 } from "./2k_QeT3T.js";
import { O, t as t_2, u } from "./B8_r5oP7.js";
import { r } from "./BpBaBBm3.js";
import { i, n, r as r_2, t as t_3 } from "./ccMIPn_w.js";
import { t as t_4 } from "./Cf85K_3V.js";
import { i as i_2, t as t_5 } from "./CJNUlr67.js";
import { t as t_6 } from "./BqJ9I9M42.js";
import { t as t_7 } from "./JgXkd7uo2.js";
import { b as b_2, x as x_1 } from "./1uxVtXhK2.js";
import { t as t_8 } from "./D_Sm39l5.js";
import { t as t_9 } from "./25FdeeAd.js";
import { t as t_10 } from "./DcUUodPk.js";
import { t as t_11 } from "./CJ5SUZOH2.js";
const k = {
  class: `divide-y divide-gray-100 dark:divide-gray-800`,
};
const A = {
  class: `grid grid-cols-1 gap-2 xl:grid-cols-2`,
};
const j = Object.assign(
  k_1({
    __name: `OptimizationSettings`,
    props: {
      config: {},
      exchange: {},
    },
    setup(t) {
      let a = t_2();
      let s = g(() => [`free`, `guest`, ``].includes(a.plan));
      let l = g(() => {
        let e = a.systemInfo.cpu_cores || 1;
        if (s.value) {
          return Math.min(6, e);
        }
        return e;
      });
      return (o, d) => {
        let f = n;
        let p = t_1;
        let m = b_2;
        let g = x_1;
        let _ = t_7;
        let v = t_3;
        mt();
        return b(`div`, k, [
          D(
            _,
            {
              title: `Optimization`,
              flat: ``,
            },
            {
              default: qt(() => [
                __1(`div`, A, [
                  D(
                    f,
                    {
                      modelValue: t.config.objective_function,
                      "onUpdate:modelValue": (d[0] ||= (e) =>
                        (t.config.objective_function = e)),
                      compact: ``,
                      title: `Objective Function`,
                      description: `Metric used to rank optimization candidates.`,
                      options: [`sharpe`, `calmar`, `sortino`, `omega`],
                    },
                    null,
                    8,
                    [`modelValue`],
                  ),
                  D(
                    m,
                    {
                      title: `Warmup Candles`,
                      description: `Number of candles loaded before each trial.`,
                    },
                    {
                      default: qt(() => [
                        D(
                          p,
                          {
                            modelValue: t.config.warm_up_candles,
                            "onUpdate:modelValue": (d[1] ||= (e) =>
                              (t.config.warm_up_candles = e)),
                            class: `w-full`,
                            type: `number`,
                            min: `0`,
                          },
                          null,
                          8,
                          [`modelValue`],
                        ),
                      ]),
                      _: 1,
                    },
                  ),
                  D(
                    m,
                    {
                      title: `Trials`,
                      description: `Number of trials per hyperparameter.`,
                    },
                    {
                      default: qt(() => [
                        D(
                          p,
                          {
                            modelValue: t.config.trials,
                            "onUpdate:modelValue": (d[2] ||= (e) =>
                              (t.config.trials = e)),
                            class: `w-full`,
                            type: `number`,
                            min: `1`,
                          },
                          null,
                          8,
                          [`modelValue`],
                        ),
                      ]),
                      _: 1,
                    },
                  ),
                  D(
                    m,
                    {
                      title: `Best Candidates`,
                      description: `Number of top candidates displayed in the results.`,
                    },
                    {
                      default: qt(() => [
                        D(
                          p,
                          {
                            modelValue: t.config.best_candidates_count,
                            "onUpdate:modelValue": (d[3] ||= (e) =>
                              (t.config.best_candidates_count = e)),
                            class: `w-full`,
                            type: `number`,
                            min: `1`,
                          },
                          null,
                          8,
                          [`modelValue`],
                        ),
                      ]),
                      _: 1,
                    },
                  ),
                  D(
                    g,
                    {
                      modelValue: t.config.cpu_cores,
                      "onUpdate:modelValue": (d[4] ||= (e) =>
                        (t.config.cpu_cores = e)),
                      compact: ``,
                      title: `CPU Cores (${t.config.cpu_cores} / ${On(a).systemInfo.cpu_cores})`,
                      description: On(s)
                        ? `Limited to 6 cores on the free plan.`
                        : `Processor cores used for optimization.`,
                      min: 1,
                      max: On(l),
                    },
                    null,
                    8,
                    [`modelValue`, `title`, `description`, `max`],
                  ),
                ]),
              ]),
              _: 1,
            },
          ),
          D(
            v,
            {
              modelValue: t.config.exchange,
              "onUpdate:modelValue": (d[5] ||= (e) => (t.config.exchange = e)),
              "exchange-name": t.exchange,
              flat: ``,
            },
            null,
            8,
            [`modelValue`, `exchange-name`],
          ),
        ]);
      };
    },
  }),
  {
    __name: `SettingsOptimizationSettings`,
  },
);
const M = {
  class: `flex-1 flex flex-col p-3`,
};
const N = {
  class: `flex-1 rounded-2xl border border-gray-200 bg-gray-100/70 dark:border-gray-800 dark:bg-gray-950`,
};
const P = {
  key: 1,
  class: `space-y-3`,
};
const F = {
  class: `divide-y divide-gray-100 dark:divide-gray-800`,
};
const I = {
  class: `flex items-center justify-between gap-4 px-4 py-3`,
};
const L = {
  class: `flex items-center justify-between gap-4 px-4 py-3`,
};
const R = {
  class: `flex items-center gap-2 select-none`,
};
const z = {
  class: `flex items-center justify-between gap-4 px-4 py-3`,
};
const B = {
  class: `flex items-center gap-2 select-none`,
};
const V = {
  class: `grid grid-cols-1 gap-2 lg:grid-cols-2`,
};
const H = {
  key: 0,
  class: `space-y-4`,
};
const U = {
  class: `px-4 py-3.5 space-y-3`,
};
const W = {
  class: `flex items-center justify-between text-sm`,
};
const oe = {
  class: `ml-4 truncate font-semibold text-gray-900 dark:text-gray-100`,
};
const G = {
  class: `flex items-center justify-between text-sm`,
};
const K = {
  class: `ml-4 truncate font-semibold text-gray-900 dark:text-gray-100`,
};
const q = {
  class: `flex items-center justify-between text-sm`,
};
const se = {
  class: `ml-4 truncate font-semibold text-gray-900 dark:text-gray-100`,
};
const ce = {
  class: `flex items-center justify-between text-sm`,
};
const le = {
  class: `ml-4 truncate font-semibold text-gray-900 dark:text-gray-100`,
};
const ue = {
  class: `flex items-center justify-between text-sm`,
};
const de = {
  class: `ml-4 truncate font-semibold text-gray-900 dark:text-gray-100`,
};
const J = k_1({
  __name: `index`,
  setup(s) {
    r({
      title: `Optimization - Jesse`,
    });
    let x = st();
    let C = u();
    let E = g(() => C.form);
    let k = vn(false);
    let A = vn(true);
    let J = vn([]);
    let fe = g(() =>
      t_2().jesseSupportedTimeframes.map((e) => ({
        label: e,
        value: e,
      })),
    );
    ct(() => {
      C.ensureFormConfig();
      setTimeout(async () => {
        X();
        try {
          let e = (sessionStorage.getItem(`previousRoute`) || ``).match(
            /\/optimization\/[^/]+$/,
          );
          sessionStorage.removeItem(`previousRoute`);
          if (!e) {
            let e = await C.getRunningSession();
            if (e) {
              Z(`/optimization/${e}`);
              return;
            }
          }
        } finally {
          A.value = false;
        }
      }, 50);
    });
    let Y = vn([]);
    async function X() {
      Y.value = await t_2().getExchangeSupportedSymbols(E.value.exchange);
      for (let e of [...E.value.routes, ...E.value.data_routes]) {
        if (!Y.value.includes(e.symbol)) {
          e.symbol = Y.value[0];
        }
      }
    }
    E.value.exchange = E.value.exchange || t_2().backtestingExchangeNames[0];
    Ht(
      () => E.value.exchange,
      (e, t) => {
        if (e !== t) {
          C.ensureFormConfig();
        }
      },
    );
    async function pe() {
      if (J.value.length) {
        for (let e = 0; e < J.value.length; e++) {
          O(`error`, J.value[e]);
        }
        return;
      }
      if (E.value.routes.length > 1) {
        O(
          `error`,
          `Optimization mode does not support multiple routes at the moment.`,
        );
        return;
      }
      k.value = true;
      let e = await u().start();
      if (e && e.status === `success`) {
        Z(`/optimization/${e.id}?status=running`);
      }
      k.value = false;
    }
    function Z(e) {
      x.push(e);
    }
    return (t, a) => {
      let o = t_11;
      let s = t_4;
      let f = t_1;
      let m = i_2;
      let g = t_7;
      let v = i;
      let y = x_1;
      let x = t_6;
      let C = r_2;
      let Q = t_9;
      let $ = t_5;
      let me = t_10;
      mt();
      return b(`div`, M, [
        __1(`div`, N, [
          D(
            me,
            {
              compact: ``,
            },
            {
              left: qt(() => [
                A.value
                  ? (mt(),
                    v_1(o, {
                      key: 0,
                    }))
                  : y_1(``, true),
                A.value
                  ? y_1(``, true)
                  : (mt(),
                    b(`div`, P, [
                      D(
                        g,
                        {
                          title: `Setup`,
                          flush: ``,
                          help: `Pick the exchange, the training period the optimizer learns from, and the testing period used to validate the found parameters.`,
                        },
                        {
                          default: qt(() => [
                            __1(`div`, F, [
                              __1(`div`, I, [
                                (a[9] ||= __1(
                                  `span`,
                                  {
                                    class: `shrink-0 text-sm font-medium text-gray-500 dark:text-gray-400`,
                                  },
                                  `Exchange`,
                                  -1,
                                )),
                                D(
                                  s,
                                  {
                                    modelValue: E.value.exchange,
                                    "onUpdate:modelValue": [
                                      (a[0] ||= (e) => (E.value.exchange = e)),
                                      X,
                                    ],
                                    placeholder: `Select an exchange...`,
                                    class: `w-80`,
                                    items: On(t_2)().backtestingExchangeNames,
                                  },
                                  null,
                                  8,
                                  [`modelValue`, `items`],
                                ),
                              ]),
                              __1(`div`, L, [
                                (a[10] ||= __1(
                                  `span`,
                                  {
                                    class: `shrink-0 text-sm font-medium text-gray-500 dark:text-gray-400`,
                                  },
                                  `Training period`,
                                  -1,
                                )),
                                __1(`div`, R, [
                                  D(
                                    f,
                                    {
                                      modelValue: E.value.training_start_date,
                                      "onUpdate:modelValue": (a[1] ||= (e) =>
                                        (E.value.training_start_date = e)),
                                      type: `date`,
                                      variant: `outline`,
                                      class: `w-44`,
                                    },
                                    null,
                                    8,
                                    [`modelValue`],
                                  ),
                                  D(m, {
                                    name: `i-heroicons-arrow-right`,
                                    class: `size-4 shrink-0 text-gray-400 dark:text-gray-600`,
                                  }),
                                  D(
                                    f,
                                    {
                                      modelValue: E.value.training_finish_date,
                                      "onUpdate:modelValue": (a[2] ||= (e) =>
                                        (E.value.training_finish_date = e)),
                                      type: `date`,
                                      variant: `outline`,
                                      class: `w-44`,
                                    },
                                    null,
                                    8,
                                    [`modelValue`],
                                  ),
                                ]),
                              ]),
                              __1(`div`, z, [
                                (a[11] ||= __1(
                                  `span`,
                                  {
                                    class: `shrink-0 text-sm font-medium text-gray-500 dark:text-gray-400`,
                                  },
                                  `Testing period`,
                                  -1,
                                )),
                                __1(`div`, B, [
                                  D(
                                    f,
                                    {
                                      modelValue: E.value.testing_start_date,
                                      "onUpdate:modelValue": (a[3] ||= (e) =>
                                        (E.value.testing_start_date = e)),
                                      type: `date`,
                                      variant: `outline`,
                                      class: `w-44`,
                                    },
                                    null,
                                    8,
                                    [`modelValue`],
                                  ),
                                  D(m, {
                                    name: `i-heroicons-arrow-right`,
                                    class: `size-4 shrink-0 text-gray-400 dark:text-gray-600`,
                                  }),
                                  D(
                                    f,
                                    {
                                      modelValue: E.value.testing_finish_date,
                                      "onUpdate:modelValue": (a[4] ||= (e) =>
                                        (E.value.testing_finish_date = e)),
                                      type: `date`,
                                      variant: `outline`,
                                      class: `w-44`,
                                    },
                                    null,
                                    8,
                                    [`modelValue`],
                                  ),
                                ]),
                              ]),
                            ]),
                          ]),
                          _: 1,
                        },
                      ),
                      D(
                        v,
                        {
                          "total-routes-error": J.value,
                          form: E.value,
                          mode: `optimization`,
                          symbols: Y.value,
                          timeframes: fe.value,
                        },
                        null,
                        8,
                        [`total-routes-error`, `form`, `symbols`, `timeframes`],
                      ),
                      D(
                        g,
                        {
                          title: `Optimal Trades`,
                          help: `How many trades you would consider optimal for your strategy in this period, so DNAs producing too few trades get filtered out.`,
                          "help-link": `https://docs.jesse.trade/docs/optimize/executing-the-optimize-mode.html`,
                        },
                        {
                          default: qt(() => [
                            D(
                              y,
                              {
                                modelValue: E.value.optimal_total,
                                "onUpdate:modelValue": (a[5] ||= (e) =>
                                  (E.value.optimal_total = e)),
                                title: `Optimal number of trades:`,
                              },
                              null,
                              8,
                              [`modelValue`],
                            ),
                          ]),
                          _: 1,
                        },
                      ),
                      D(
                        g,
                        {
                          title: `Options`,
                        },
                        {
                          default: qt(() => [
                            __1(`div`, V, [
                              D(
                                x,
                                {
                                  modelValue: E.value.fast_mode,
                                  "onUpdate:modelValue": (a[6] ||= (e) =>
                                    (E.value.fast_mode = e)),
                                  compact: ``,
                                  title: `Fast Mode`,
                                  description: `Runs the backtests faster using an improved algorithm.`,
                                },
                                null,
                                8,
                                [`modelValue`],
                              ),
                            ]),
                          ]),
                          _: 1,
                        },
                      ),
                      E.value.config
                        ? (mt(),
                          v_1(
                            C,
                            {
                              key: 0,
                            },
                            {
                              default: qt(() => [
                                D(
                                  j,
                                  {
                                    config: E.value.config,
                                    exchange: E.value.exchange,
                                  },
                                  null,
                                  8,
                                  [`config`, `exchange`],
                                ),
                              ]),
                              _: 1,
                            },
                          ))
                        : y_1(``, true),
                    ])),
              ]),
              right: qt(() => [
                A.value
                  ? (mt(),
                    b(`div`, H, [
                      D(Q, {
                        class: `h-16 w-full`,
                      }),
                      D(Q, {
                        class: `h-16 w-full`,
                      }),
                    ]))
                  : y_1(``, true),
                A.value
                  ? y_1(``, true)
                  : (mt(),
                    v_1(
                      g,
                      {
                        key: 1,
                        title: `Summary`,
                        flush: ``,
                        "overflow-hidden": ``,
                        selectable: ``,
                      },
                      {
                        footer: qt(() => [
                          D(
                            $,
                            {
                              block: ``,
                              icon: `i-heroicons-bolt`,
                              variant: `solid`,
                              size: `lg`,
                              label: `Start optimization`,
                              disabled: k.value,
                              loading: k.value,
                              trailing: false,
                              onClick: (a[7] ||= (e) => pe()),
                            },
                            null,
                            8,
                            [`disabled`, `loading`],
                          ),
                          D($, {
                            block: ``,
                            class: `mt-2`,
                            color: `neutral`,
                            icon: `i-heroicons-clock`,
                            variant: `ghost`,
                            size: `lg`,
                            label: `History`,
                            trailing: false,
                            onClick: (a[8] ||= (e) =>
                              Z(`/optimization/history`)),
                          }),
                        ]),
                        default: qt(() => [
                          __1(`dl`, U, [
                            __1(`div`, W, [
                              (a[12] ||= __1(
                                `dt`,
                                {
                                  class: `font-medium text-gray-500 dark:text-gray-400`,
                                },
                                `Exchange:`,
                                -1,
                              )),
                              __1(`dd`, oe, nr(E.value.exchange || `-`), 1),
                            ]),
                            __1(`div`, G, [
                              (a[13] ||= __1(
                                `dt`,
                                {
                                  class: `font-medium text-gray-500 dark:text-gray-400`,
                                },
                                `Training:`,
                                -1,
                              )),
                              __1(
                                `dd`,
                                K,
                                nr(
                                  (`daysBetween` in t
                                    ? t.daysBetween
                                    : On(t_8))(
                                    E.value.training_start_date,
                                    E.value.training_finish_date,
                                  ),
                                ) + ` days`,
                                1,
                              ),
                            ]),
                            __1(`div`, q, [
                              (a[14] ||= __1(
                                `dt`,
                                {
                                  class: `font-medium text-gray-500 dark:text-gray-400`,
                                },
                                `Testing:`,
                                -1,
                              )),
                              __1(
                                `dd`,
                                se,
                                nr(
                                  (`daysBetween` in t
                                    ? t.daysBetween
                                    : On(t_8))(
                                    E.value.testing_start_date,
                                    E.value.testing_finish_date,
                                  ),
                                ) + ` days`,
                                1,
                              ),
                            ]),
                            __1(`div`, ce, [
                              (a[15] ||= __1(
                                `dt`,
                                {
                                  class: `font-medium text-gray-500 dark:text-gray-400`,
                                },
                                `Route:`,
                                -1,
                              )),
                              __1(
                                `dd`,
                                le,
                                nr(
                                  E.value.routes[0]
                                    ? `${E.value.routes[0].symbol || `?`} · ${E.value.routes[0].timeframe}`
                                    : `-`,
                                ),
                                1,
                              ),
                            ]),
                            __1(`div`, ue, [
                              (a[16] ||= __1(
                                `dt`,
                                {
                                  class: `font-medium text-gray-500 dark:text-gray-400`,
                                },
                                `Optimal trades:`,
                                -1,
                              )),
                              __1(`dd`, de, nr(E.value.optimal_total), 1),
                            ]),
                          ]),
                        ]),
                        _: 1,
                      },
                    )),
              ]),
              _: 1,
            },
          ),
        ]),
      ]);
    };
  },
});
export { J as default };
