import {
  D as D_1,
  E,
  Ht,
  On,
  Qn,
  _ as __1,
  b,
  ct,
  ft,
  g as g_1,
  k as k_1,
  mt,
  nr,
  qt,
  v,
  vn,
  y,
} from "./CoKk4mC0.js";
import { Et } from "./Cd-sGgPF.js";
import { S, ut } from "./B8_r5oP7.js";
import { r } from "./BpBaBBm3.js";
import { t } from "./CpdwwrfH.js";
import { t as t_2 } from "./B02lME3Q.js";
import { i as i_1, t as t_3 } from "./CJNUlr67.js";
import { t as t_4 } from "./EoqKQiEy2.js";
import { t as t_5 } from "./BDNMzG2s2.js";
import { t as t_6 } from "./D1yN6wZY2.js";
import { t as t_7 } from "./BjshL_xA2.js";
function D(e, t) {
  mt();
  return b(
    `svg`,
    {
      xmlns: `http://www.w3.org/2000/svg`,
      fill: `none`,
      viewBox: `0 0 24 24`,
      "stroke-width": `1.5`,
      stroke: `currentColor`,
      "aria-hidden": `true`,
      "data-slot": `icon`,
    },
    [
      __1(`path`, {
        "stroke-linecap": `round`,
        "stroke-linejoin": `round`,
        d: `M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z`,
      }),
    ],
  );
}
const O = ut(`home`, {
  state: () => ({
    systemInfo: {
      cpu_cores: 0,
      cpu_usage_percent: 0,
      ram_usage_percent: 0,
      ram_total_gb: 0,
      ram_used_gb: 0,
      jesse_version: ``,
      strategy_count: 0,
    },
    userActivity: {
      backtests: {
        all_time: 0,
        last_24h: 0,
        last_7d: 0,
      },
      optimizations: {
        all_time: 0,
        last_24h: 0,
        last_7d: 0,
      },
      live_sessions: {
        all_time: 0,
        last_24h: 0,
        last_7d: 0,
      },
      monte_carlo: {
        all_time: 0,
        last_24h: 0,
        last_7d: 0,
      },
      significance_tests: {
        all_time: 0,
        last_24h: 0,
        last_7d: 0,
      },
    },
    loading: false,
  }),
  getters: {
    isNewUser(e) {
      return (
        e.userActivity.backtests.all_time === 0 &&
        e.userActivity.optimizations.all_time === 0 &&
        e.userActivity.live_sessions.all_time === 0 &&
        e.userActivity.monte_carlo.all_time === 0 &&
        e.userActivity.significance_tests.all_time === 0
      );
    },
  },
  actions: {
    async fetchSystemInfo() {
      let { data, error } = await S(`/system/system-info`, {
        authenticated: true,
      });
      if (!error.value && data.value) {
        this.systemInfo = data.value;
      }
    },
    async fetchUserActivity() {
      let { data, error } = await S(`/system/user-activity`, {
        authenticated: true,
      });
      if (!error.value && data.value) {
        this.userActivity = data.value;
      }
    },
    async init() {
      this.loading = true;
      await Promise.all([this.fetchSystemInfo(), this.fetchUserActivity()]);
      this.loading = false;
    },
  },
});
const k = {
  class: `text-center pt-12 pb-6 lg:pt-16 lg:pb-8`,
};
const A = {
  class: `text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl dark:text-gray-100 min-h-[4rem] sm:min-h-[5rem] md:min-h-[6rem] flex items-center justify-center`,
};
const j = {
  key: 0,
  class: `animate-pulse text-indigo-500`,
};
const M = Object.assign(
  k_1({
    __name: `WelcomeHero`,
    props: {
      isNewUser: {
        type: Boolean,
        default: false,
      },
    },
    setup(e) {
      let r = e;
      let l = r.isNewUser
        ? `Welcome to your quantitative research lab.`
        : `System online. Ready to research.`;
      let u = vn(``);
      let p = vn(true);
      let m = vn(false);
      let _ = null;
      let v = () => {
        let e = 0;
        u.value = ``;
        m.value = false;
        p.value = true;
        if (_) {
          clearInterval(_);
        }
        _ = t_7(() => {
          if (e < l.length) {
            u.value += l.charAt(e);
            e++;
          } else {
            if (_) {
              clearInterval(_);
            }
            m.value = true;
            setTimeout(() => {
              p.value = false;
            }, 3000);
          }
        }, 60);
      };
      ct(() => {
        v();
      });
      ft(() => {
        if (_) {
          clearInterval(_);
        }
      });
      Ht(
        () => r.isNewUser,
        () => {
          v();
        },
      );
      return (n, r) => {
        mt();
        return b(`div`, k, [
          __1(`h1`, A, [
            __1(`span`, null, [
              E(nr(u.value), 1),
              p.value ? (mt(), b(`span`, j, `_`)) : y(``, true),
            ]),
          ]),
          __1(
            `p`,
            {
              class: Qn([
                `mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl dark:text-gray-400 transition-opacity duration-1000`,
                {
                  "opacity-0": !m.value,
                  "opacity-100": m.value,
                },
              ]),
            },
            nr(
              e.isNewUser
                ? `Ready to get started? Follow the steps below.`
                : `Welcome back. Here is your system overview.`,
            ),
            3,
          ),
        ]);
      };
    },
  }),
  {
    __name: `HomeWelcomeHero`,
  },
);
const N = {
  class: `max-w-5xl mx-auto pt-2 pb-8`,
};
const P = {
  class: `grid grid-cols-1 md:grid-cols-3 gap-6`,
};
const F = {
  class: `flex items-center justify-between`,
};
const I = {
  class: `flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white`,
};
const L = {
  class: `flex items-center justify-between`,
};
const R = {
  class: `flex items-center justify-center h-12 w-12 rounded-md bg-purple-500 text-white`,
};
const z = {
  class: `flex items-center justify-between`,
};
const B = {
  class: `flex items-center justify-center h-12 w-12 rounded-md bg-green-500 text-white`,
};
const V = Object.assign(
  k_1({
    __name: `OnboardingFlow`,
    setup(n) {
      return (n, i) => {
        let s = t_3;
        let c = t_6;
        mt();
        return b(`div`, N, [
          (i[9] ||= __1(
            `div`,
            {
              class: `mb-8 text-center`,
            },
            [
              __1(
                `h2`,
                {
                  class: `text-2xl font-bold text-gray-900 dark:text-white`,
                },
                `Your First Steps`,
              ),
              __1(
                `p`,
                {
                  class: `mt-2 text-gray-600 dark:text-gray-400`,
                },
                `Complete these three steps to run your first backtest.`,
              ),
            ],
            -1,
          )),
          __1(`div`, P, [
            D_1(
              c,
              {
                class: `relative flex flex-col h-full hover:ring-2 hover:ring-indigo-500 transition-shadow`,
              },
              {
                header: qt(() => [
                  __1(`div`, F, [
                    __1(`div`, I, [
                      D_1(On(t), {
                        class: `h-6 w-6`,
                        "aria-hidden": `true`,
                      }),
                    ]),
                    (i[0] ||= __1(
                      `span`,
                      {
                        class: `text-sm font-medium text-gray-500 dark:text-gray-400`,
                      },
                      `Step 1`,
                      -1,
                    )),
                  ]),
                ]),
                footer: qt(() => [
                  D_1(
                    s,
                    {
                      to: `/candles`,
                      color: `primary`,
                      variant: `soft`,
                      block: ``,
                      icon: `i-heroicons-arrow-right`,
                      trailing: ``,
                    },
                    {
                      default: qt(() => [
                        ...(i[1] ||= [E(` Import Candles `, -1)]),
                      ]),
                      _: 1,
                    },
                  ),
                ]),
                default: qt(() => [
                  (i[2] ||= __1(
                    `div`,
                    {
                      class: `flex-1`,
                    },
                    [
                      __1(
                        `h3`,
                        {
                          class: `text-lg font-medium text-gray-900 dark:text-white mb-2`,
                        },
                        `Import Data`,
                      ),
                      __1(
                        `p`,
                        {
                          class: `text-sm text-gray-600 dark:text-gray-400`,
                        },
                        ` Historical data (candles) is required to test any strategy. Import free data from supported exchanges. `,
                      ),
                    ],
                    -1,
                  )),
                ]),
                _: 1,
              },
            ),
            D_1(
              c,
              {
                class: `relative flex flex-col h-full hover:ring-2 hover:ring-indigo-500 transition-shadow`,
              },
              {
                header: qt(() => [
                  __1(`div`, L, [
                    __1(`div`, R, [
                      D_1(On(t_2), {
                        class: `h-6 w-6`,
                        "aria-hidden": `true`,
                      }),
                    ]),
                    (i[3] ||= __1(
                      `span`,
                      {
                        class: `text-sm font-medium text-gray-500 dark:text-gray-400`,
                      },
                      `Step 2`,
                      -1,
                    )),
                  ]),
                ]),
                footer: qt(() => [
                  D_1(
                    s,
                    {
                      to: `/strategies`,
                      color: `primary`,
                      variant: `soft`,
                      block: ``,
                      icon: `i-heroicons-arrow-right`,
                      trailing: ``,
                    },
                    {
                      default: qt(() => [
                        ...(i[4] ||= [E(` Manage Strategies `, -1)]),
                      ]),
                      _: 1,
                    },
                  ),
                ]),
                default: qt(() => [
                  (i[5] ||= __1(
                    `div`,
                    {
                      class: `flex-1`,
                    },
                    [
                      __1(
                        `h3`,
                        {
                          class: `text-lg font-medium text-gray-900 dark:text-white mb-2`,
                        },
                        `Create Strategy`,
                      ),
                      __1(
                        `p`,
                        {
                          class: `text-sm text-gray-600 dark:text-gray-400`,
                        },
                        ` Write your own Python strategy using our built-in Monaco editor or import an existing one. `,
                      ),
                    ],
                    -1,
                  )),
                ]),
                _: 1,
              },
            ),
            D_1(
              c,
              {
                class: `relative flex flex-col h-full hover:ring-2 hover:ring-indigo-500 transition-shadow`,
              },
              {
                header: qt(() => [
                  __1(`div`, z, [
                    __1(`div`, B, [
                      D_1(On(D), {
                        class: `h-6 w-6`,
                        "aria-hidden": `true`,
                      }),
                    ]),
                    (i[6] ||= __1(
                      `span`,
                      {
                        class: `text-sm font-medium text-gray-500 dark:text-gray-400`,
                      },
                      `Step 3`,
                      -1,
                    )),
                  ]),
                ]),
                footer: qt(() => [
                  D_1(
                    s,
                    {
                      to: `/backtest`,
                      color: `success`,
                      variant: `soft`,
                      block: ``,
                      icon: `i-heroicons-arrow-right`,
                      trailing: ``,
                    },
                    {
                      default: qt(() => [
                        ...(i[7] ||= [E(` New Backtest `, -1)]),
                      ]),
                      _: 1,
                    },
                  ),
                ]),
                default: qt(() => [
                  (i[8] ||= __1(
                    `div`,
                    {
                      class: `flex-1`,
                    },
                    [
                      __1(
                        `h3`,
                        {
                          class: `text-lg font-medium text-gray-900 dark:text-white mb-2`,
                        },
                        `Run Backtest`,
                      ),
                      __1(
                        `p`,
                        {
                          class: `text-sm text-gray-600 dark:text-gray-400`,
                        },
                        ` Combine your data and strategy to simulate how it would have performed in the past. `,
                      ),
                    ],
                    -1,
                  )),
                ]),
                _: 1,
              },
            ),
          ]),
        ]);
      };
    },
  }),
  {
    __name: `HomeOnboardingFlow`,
  },
);
const H = {
  class: `flex items-center justify-between`,
};
const U = {
  class: `text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2`,
};
const W = {
  class: `grid grid-cols-1 md:grid-cols-2 gap-8`,
};
const G = {
  class: `flex justify-between items-end mb-2`,
};
const K = {
  class: `text-xs text-gray-500 ml-2`,
};
const q = {
  class: `flex justify-between items-end mb-2`,
};
const J = {
  class: `text-xs text-gray-500 ml-2`,
};
const Y = {
  class: `mt-8 pt-6 border-t border-gray-200 dark:border-gray-800 grid grid-cols-2 gap-4`,
};
const X = {
  class: `mt-1 flex items-baseline gap-2`,
};
const Z = {
  class: `text-2xl font-semibold text-gray-900 dark:text-white`,
};
const Q = {
  class: `mt-1 flex items-baseline gap-2`,
};
const ne = {
  class: `text-2xl font-semibold text-gray-900 dark:text-white`,
};
const re = Object.assign(
  k_1({
    __name: `SystemMonitor`,
    setup(n) {
      let r = O();
      let o = g_1(() => r.systemInfo);
      let u = null;
      let h = (e) => {
        if (e > 90) {
          return `text-red-500`;
        }
        if (e > 75) {
          return `text-orange-500`;
        }
        return `text-green-500`;
      };
      let g = (e) => {
        if (e > 90) {
          return `error`;
        }
        if (e > 75) {
          return `warning`;
        }
        return `success`;
      };
      ct(() => {
        u = t_7(() => {
          r.fetchSystemInfo();
        }, 5000);
      });
      ft(() => {
        if (u) {
          clearInterval(u);
        }
      });
      return (n, r) => {
        let s = i_1;
        let c = t_4;
        let l = t_6;
        mt();
        return v(
          l,
          {
            class: `w-full`,
          },
          {
            header: qt(() => [
              __1(`div`, H, [
                __1(`h3`, U, [
                  D_1(s, {
                    name: `i-heroicons-cpu-chip`,
                    class: `w-5 h-5 text-gray-500`,
                  }),
                  (r[0] ||= E(` System Monitor `, -1)),
                ]),
                (r[1] ||= __1(
                  `div`,
                  {
                    class: `flex items-center gap-2`,
                  },
                  [
                    __1(
                      `span`,
                      {
                        class: `relative flex h-2.5 w-2.5`,
                      },
                      [
                        __1(`span`, {
                          class: `animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75`,
                        }),
                        __1(`span`, {
                          class: `relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500`,
                        }),
                      ],
                    ),
                    __1(
                      `span`,
                      {
                        class: `text-xs text-gray-500 uppercase tracking-wider font-semibold`,
                      },
                      `Live`,
                    ),
                  ],
                  -1,
                )),
              ]),
            ]),
            default: qt(() => [
              __1(`div`, W, [
                __1(`div`, null, [
                  __1(`div`, G, [
                    __1(`div`, null, [
                      (r[2] ||= __1(
                        `span`,
                        {
                          class: `text-sm font-medium text-gray-700 dark:text-gray-300`,
                        },
                        `CPU Usage`,
                        -1,
                      )),
                      __1(
                        `span`,
                        K,
                        `(` + nr(o.value.cpu_cores) + ` Cores)`,
                        1,
                      ),
                    ]),
                    __1(
                      `span`,
                      {
                        class: Qn([
                          `text-sm font-bold`,
                          h(o.value.cpu_usage_percent),
                        ]),
                      },
                      nr(o.value.cpu_usage_percent) + `% `,
                      3,
                    ),
                  ]),
                  D_1(
                    c,
                    {
                      "model-value": o.value.cpu_usage_percent,
                      color: g(o.value.cpu_usage_percent),
                    },
                    null,
                    8,
                    [`model-value`, `color`],
                  ),
                ]),
                __1(`div`, null, [
                  __1(`div`, q, [
                    __1(`div`, null, [
                      (r[3] ||= __1(
                        `span`,
                        {
                          class: `text-sm font-medium text-gray-700 dark:text-gray-300`,
                        },
                        `RAM Usage`,
                        -1,
                      )),
                      __1(
                        `span`,
                        J,
                        `(` +
                          nr(o.value.ram_used_gb) +
                          ` / ` +
                          nr(o.value.ram_total_gb) +
                          ` GB)`,
                        1,
                      ),
                    ]),
                    __1(
                      `span`,
                      {
                        class: Qn([
                          `text-sm font-bold`,
                          h(o.value.ram_usage_percent),
                        ]),
                      },
                      nr(o.value.ram_usage_percent) + `% `,
                      3,
                    ),
                  ]),
                  D_1(
                    c,
                    {
                      "model-value": o.value.ram_usage_percent,
                      color: g(o.value.ram_usage_percent),
                    },
                    null,
                    8,
                    [`model-value`, `color`],
                  ),
                ]),
              ]),
              __1(`div`, Y, [
                __1(`div`, null, [
                  (r[5] ||= __1(
                    `p`,
                    {
                      class: `text-sm font-medium text-gray-500 dark:text-gray-400`,
                    },
                    `Jesse Environment`,
                    -1,
                  )),
                  __1(`div`, X, [
                    __1(`p`, Z, nr(o.value.jesse_version || `Unknown`), 1),
                    (r[4] ||= __1(
                      `p`,
                      {
                        class: `text-sm text-gray-500`,
                      },
                      `Version`,
                      -1,
                    )),
                  ]),
                ]),
                __1(`div`, null, [
                  (r[7] ||= __1(
                    `p`,
                    {
                      class: `text-sm font-medium text-gray-500 dark:text-gray-400`,
                    },
                    `Workspace`,
                    -1,
                  )),
                  __1(`div`, Q, [
                    __1(`p`, ne, nr(o.value.strategy_count), 1),
                    (r[6] ||= __1(
                      `p`,
                      {
                        class: `text-sm text-gray-500`,
                      },
                      `Strategies`,
                      -1,
                    )),
                  ]),
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
    __name: `HomeSystemMonitor`,
  },
);
const ie = {
  class: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`,
};
const ae = {
  class: `flex items-center gap-2`,
};
const oe = {
  class: `p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center`,
};
const se = {
  class: `grid grid-cols-3 gap-4 text-center divide-x divide-gray-200 dark:divide-gray-800`,
};
const ce = {
  class: `px-2`,
};
const le = {
  class: `mt-2 text-2xl font-semibold text-gray-900 dark:text-white`,
};
const ue = {
  class: `px-2`,
};
const de = {
  class: `mt-2 text-2xl font-semibold text-gray-900 dark:text-white`,
};
const fe = {
  class: `px-2`,
};
const pe = {
  class: `mt-2 text-2xl font-semibold text-gray-900 dark:text-white`,
};
const me = {
  class: `flex items-center gap-2`,
};
const he = {
  class: `p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center`,
};
const ge = {
  class: `grid grid-cols-3 gap-4 text-center divide-x divide-gray-200 dark:divide-gray-800`,
};
const _e = {
  class: `px-2`,
};
const ve = {
  class: `mt-2 text-2xl font-semibold text-gray-900 dark:text-white`,
};
const ye = {
  class: `px-2`,
};
const be = {
  class: `mt-2 text-2xl font-semibold text-gray-900 dark:text-white`,
};
const xe = {
  class: `px-2`,
};
const Se = {
  class: `mt-2 text-2xl font-semibold text-gray-900 dark:text-white`,
};
const Ce = {
  class: `flex items-center gap-2`,
};
const we = {
  class: `p-2 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center`,
};
const Te = {
  class: `grid grid-cols-3 gap-4 text-center divide-x divide-gray-200 dark:divide-gray-800`,
};
const Ee = {
  class: `px-2`,
};
const De = {
  class: `mt-2 text-2xl font-semibold text-gray-900 dark:text-white`,
};
const Oe = {
  class: `px-2`,
};
const ke = {
  class: `mt-2 text-2xl font-semibold text-gray-900 dark:text-white`,
};
const Ae = {
  class: `px-2`,
};
const je = {
  class: `mt-2 text-2xl font-semibold text-gray-900 dark:text-white`,
};
const Me = {
  class: `flex items-center gap-2`,
};
const Ne = {
  class: `p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center`,
};
const Pe = {
  class: `grid grid-cols-3 gap-4 text-center divide-x divide-gray-200 dark:divide-gray-800`,
};
const Fe = {
  class: `px-2`,
};
const Ie = {
  class: `mt-2 text-2xl font-semibold text-gray-900 dark:text-white`,
};
const Le = {
  class: `px-2`,
};
const Re = {
  class: `mt-2 text-2xl font-semibold text-gray-900 dark:text-white`,
};
const ze = {
  class: `px-2`,
};
const Be = {
  class: `mt-2 text-2xl font-semibold text-gray-900 dark:text-white`,
};
const Ve = {
  class: `flex items-center gap-2`,
};
const He = {
  class: `p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg flex items-center justify-center`,
};
const Ue = {
  class: `grid grid-cols-3 gap-4 text-center divide-x divide-gray-200 dark:divide-gray-800`,
};
const We = {
  class: `px-2`,
};
const Ge = {
  class: `mt-2 text-2xl font-semibold text-gray-900 dark:text-white`,
};
const Ke = {
  class: `px-2`,
};
const qe = {
  class: `mt-2 text-2xl font-semibold text-gray-900 dark:text-white`,
};
const Je = {
  class: `px-2`,
};
const $ = {
  class: `mt-2 text-2xl font-semibold text-gray-900 dark:text-white`,
};
const Ye = Object.assign(
  k_1({
    __name: `ActivityStats`,
    setup(t) {
      let n = O();
      let r = g_1(() => n.userActivity);
      return (t, n) => {
        let i = i_1;
        let s = t_6;
        mt();
        return b(`div`, ie, [
          D_1(s, null, {
            header: qt(() => [
              __1(`div`, ae, [
                __1(`div`, oe, [
                  D_1(i, {
                    name: `i-heroicons-beaker`,
                    class: `w-5 h-5 text-indigo-600 dark:text-indigo-400`,
                  }),
                ]),
                (n[0] ||= __1(
                  `h3`,
                  {
                    class: `text-lg font-medium text-gray-900 dark:text-white`,
                  },
                  `Backtests`,
                  -1,
                )),
              ]),
            ]),
            default: qt(() => [
              __1(`dl`, se, [
                __1(`div`, ce, [
                  (n[1] ||= __1(
                    `dt`,
                    {
                      class: `text-xs font-medium text-gray-500 uppercase tracking-wider`,
                    },
                    `24h`,
                    -1,
                  )),
                  __1(`dd`, le, nr(r.value.backtests.last_24h), 1),
                ]),
                __1(`div`, ue, [
                  (n[2] ||= __1(
                    `dt`,
                    {
                      class: `text-xs font-medium text-gray-500 uppercase tracking-wider`,
                    },
                    `7 Days`,
                    -1,
                  )),
                  __1(`dd`, de, nr(r.value.backtests.last_7d), 1),
                ]),
                __1(`div`, fe, [
                  (n[3] ||= __1(
                    `dt`,
                    {
                      class: `text-xs font-medium text-gray-500 uppercase tracking-wider`,
                    },
                    `All-Time`,
                    -1,
                  )),
                  __1(`dd`, pe, nr(r.value.backtests.all_time), 1),
                ]),
              ]),
            ]),
            _: 1,
          }),
          D_1(s, null, {
            header: qt(() => [
              __1(`div`, me, [
                __1(`div`, he, [
                  D_1(i, {
                    name: `i-heroicons-adjustments-horizontal`,
                    class: `w-5 h-5 text-purple-600 dark:text-purple-400`,
                  }),
                ]),
                (n[4] ||= __1(
                  `h3`,
                  {
                    class: `text-lg font-medium text-gray-900 dark:text-white`,
                  },
                  `Optimizations`,
                  -1,
                )),
              ]),
            ]),
            default: qt(() => [
              __1(`dl`, ge, [
                __1(`div`, _e, [
                  (n[5] ||= __1(
                    `dt`,
                    {
                      class: `text-xs font-medium text-gray-500 uppercase tracking-wider`,
                    },
                    `24h`,
                    -1,
                  )),
                  __1(`dd`, ve, nr(r.value.optimizations.last_24h), 1),
                ]),
                __1(`div`, ye, [
                  (n[6] ||= __1(
                    `dt`,
                    {
                      class: `text-xs font-medium text-gray-500 uppercase tracking-wider`,
                    },
                    `7 Days`,
                    -1,
                  )),
                  __1(`dd`, be, nr(r.value.optimizations.last_7d), 1),
                ]),
                __1(`div`, xe, [
                  (n[7] ||= __1(
                    `dt`,
                    {
                      class: `text-xs font-medium text-gray-500 uppercase tracking-wider`,
                    },
                    `All-Time`,
                    -1,
                  )),
                  __1(`dd`, Se, nr(r.value.optimizations.all_time), 1),
                ]),
              ]),
            ]),
            _: 1,
          }),
          D_1(s, null, {
            header: qt(() => [
              __1(`div`, Ce, [
                __1(`div`, we, [
                  D_1(i, {
                    name: `i-heroicons-bolt`,
                    class: `w-5 h-5 text-green-600 dark:text-green-400`,
                  }),
                ]),
                (n[8] ||= __1(
                  `h3`,
                  {
                    class: `text-lg font-medium text-gray-900 dark:text-white`,
                  },
                  `Live Trading`,
                  -1,
                )),
              ]),
            ]),
            default: qt(() => [
              __1(`dl`, Te, [
                __1(`div`, Ee, [
                  (n[9] ||= __1(
                    `dt`,
                    {
                      class: `text-xs font-medium text-gray-500 uppercase tracking-wider`,
                    },
                    `24h`,
                    -1,
                  )),
                  __1(`dd`, De, nr(r.value.live_sessions.last_24h), 1),
                ]),
                __1(`div`, Oe, [
                  (n[10] ||= __1(
                    `dt`,
                    {
                      class: `text-xs font-medium text-gray-500 uppercase tracking-wider`,
                    },
                    `7 Days`,
                    -1,
                  )),
                  __1(`dd`, ke, nr(r.value.live_sessions.last_7d), 1),
                ]),
                __1(`div`, Ae, [
                  (n[11] ||= __1(
                    `dt`,
                    {
                      class: `text-xs font-medium text-gray-500 uppercase tracking-wider`,
                    },
                    `All-Time`,
                    -1,
                  )),
                  __1(`dd`, je, nr(r.value.live_sessions.all_time), 1),
                ]),
              ]),
            ]),
            _: 1,
          }),
          D_1(s, null, {
            header: qt(() => [
              __1(`div`, Me, [
                __1(`div`, Ne, [
                  D_1(i, {
                    name: `i-heroicons-chart-pie`,
                    class: `w-5 h-5 text-orange-600 dark:text-orange-400`,
                  }),
                ]),
                (n[12] ||= __1(
                  `h3`,
                  {
                    class: `text-lg font-medium text-gray-900 dark:text-white`,
                  },
                  `Monte Carlo`,
                  -1,
                )),
              ]),
            ]),
            default: qt(() => [
              __1(`dl`, Pe, [
                __1(`div`, Fe, [
                  (n[13] ||= __1(
                    `dt`,
                    {
                      class: `text-xs font-medium text-gray-500 uppercase tracking-wider`,
                    },
                    `24h`,
                    -1,
                  )),
                  __1(`dd`, Ie, nr(r.value.monte_carlo.last_24h), 1),
                ]),
                __1(`div`, Le, [
                  (n[14] ||= __1(
                    `dt`,
                    {
                      class: `text-xs font-medium text-gray-500 uppercase tracking-wider`,
                    },
                    `7 Days`,
                    -1,
                  )),
                  __1(`dd`, Re, nr(r.value.monte_carlo.last_7d), 1),
                ]),
                __1(`div`, ze, [
                  (n[15] ||= __1(
                    `dt`,
                    {
                      class: `text-xs font-medium text-gray-500 uppercase tracking-wider`,
                    },
                    `All-Time`,
                    -1,
                  )),
                  __1(`dd`, Be, nr(r.value.monte_carlo.all_time), 1),
                ]),
              ]),
            ]),
            _: 1,
          }),
          D_1(s, null, {
            header: qt(() => [
              __1(`div`, Ve, [
                __1(`div`, He, [
                  D_1(i, {
                    name: `i-heroicons-shield-check`,
                    class: `w-5 h-5 text-pink-600 dark:text-pink-400`,
                  }),
                ]),
                (n[16] ||= __1(
                  `h3`,
                  {
                    class: `text-lg font-medium text-gray-900 dark:text-white`,
                  },
                  `Rule Significance Tests`,
                  -1,
                )),
              ]),
            ]),
            default: qt(() => [
              __1(`dl`, Ue, [
                __1(`div`, We, [
                  (n[17] ||= __1(
                    `dt`,
                    {
                      class: `text-xs font-medium text-gray-500 uppercase tracking-wider`,
                    },
                    `24h`,
                    -1,
                  )),
                  __1(`dd`, Ge, nr(r.value.significance_tests.last_24h), 1),
                ]),
                __1(`div`, Ke, [
                  (n[18] ||= __1(
                    `dt`,
                    {
                      class: `text-xs font-medium text-gray-500 uppercase tracking-wider`,
                    },
                    `7 Days`,
                    -1,
                  )),
                  __1(`dd`, qe, nr(r.value.significance_tests.last_7d), 1),
                ]),
                __1(`div`, Je, [
                  (n[19] ||= __1(
                    `dt`,
                    {
                      class: `text-xs font-medium text-gray-500 uppercase tracking-wider`,
                    },
                    `All-Time`,
                    -1,
                  )),
                  __1(`dd`, $, nr(r.value.significance_tests.all_time), 1),
                ]),
              ]),
            ]),
            _: 1,
          }),
        ]);
      };
    },
  }),
  {
    __name: `HomeActivityStats`,
  },
);
const Xe = {
  class: `mt-12 pt-8 border-t border-gray-200 dark:border-gray-800`,
};
const Ze = {
  class: `flex flex-col md:flex-row items-center justify-between gap-6`,
};
const Qe = {
  class: `flex flex-wrap justify-center gap-4`,
};
const $e = Object.assign(
  k_1({
    __name: `ResourceLinks`,
    setup(n) {
      return (n, r) => {
        let i = t_3;
        mt();
        return b(`div`, Xe, [
          __1(`div`, Ze, [
            (r[3] ||= __1(
              `div`,
              {
                class: `text-sm text-gray-500 dark:text-gray-400`,
              },
              ` Need help? Check out these resources: `,
              -1,
            )),
            __1(`div`, Qe, [
              D_1(
                i,
                {
                  to: `https://docs.jesse.trade/`,
                  target: `_blank`,
                  color: `neutral`,
                  variant: `ghost`,
                  icon: `i-heroicons-academic-cap`,
                },
                {
                  default: qt(() => [...(r[0] ||= [E(` Documentation `, -1)])]),
                  _: 1,
                },
              ),
              D_1(
                i,
                {
                  to: `https://jesse.trade/youtube`,
                  target: `_blank`,
                  color: `neutral`,
                  variant: `ghost`,
                  icon: `i-heroicons-film`,
                },
                {
                  default: qt(() => [...(r[1] ||= [E(` Tutorials `, -1)])]),
                  _: 1,
                },
              ),
              D_1(
                i,
                {
                  to: `https://jesse.trade/discord`,
                  target: `_blank`,
                  color: `neutral`,
                  variant: `ghost`,
                  icon: `i-heroicons-user-group`,
                },
                {
                  default: qt(() => [
                    ...(r[2] ||= [E(` Discord Community `, -1)]),
                  ]),
                  _: 1,
                },
              ),
            ]),
          ]),
        ]);
      };
    },
  }),
  {
    __name: `HomeResourceLinks`,
  },
);
const et = {
  class: `container mx-auto pb-12 select-none`,
};
const tt = {
  key: 0,
  class: `flex justify-center items-center min-h-[50vh]`,
};
const nt = {
  key: 1,
  class: `space-y-10`,
};
const rt = {
  key: 1,
  class: `space-y-8 max-w-7xl mx-auto`,
};
const it = {
  class: `max-w-7xl mx-auto`,
};
const at = t_5(
  k_1({
    __name: `index`,
    setup(t) {
      r({
        title: `Dashboard - Jesse`,
      });
      let n = O();
      let i = g_1(() => n.isNewUser);
      n.init();
      return (t, s) => {
        let c = i_1;
        mt();
        return b(`div`, et, [
          On(n).loading
            ? (mt(),
              b(`div`, tt, [
                D_1(c, {
                  name: `i-heroicons-arrow-path`,
                  class: `w-10 h-10 animate-spin text-gray-400`,
                }),
              ]))
            : (mt(),
              b(`div`, nt, [
                D_1(
                  M,
                  {
                    "is-new-user": i.value,
                  },
                  null,
                  8,
                  [`is-new-user`],
                ),
                D_1(
                  Et,
                  {
                    name: `fade`,
                    mode: `out-in`,
                  },
                  {
                    default: qt(() => [
                      i.value
                        ? (mt(),
                          v(V, {
                            key: 0,
                          }))
                        : (mt(), b(`div`, rt, [D_1(re), D_1(Ye)])),
                    ]),
                    _: 1,
                  },
                ),
                __1(`div`, it, [D_1($e)]),
              ])),
        ]);
      };
    },
  }),
  [[`__scopeId`, `data-v-97930ea5`]],
);
export { at as default };
