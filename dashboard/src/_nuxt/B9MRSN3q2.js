import {
  D as D_1,
  E as E_1,
  Ht as Ht_1,
  On,
  Qn,
  _ as __1,
  b,
  bt as bt_1,
  ct as ct_1,
  ft as ft_1,
  g,
  it as it_1,
  k,
  mt as mt_1,
  nr,
  o,
  qt as qt_1,
  tt as tt_1,
  v,
  vn as vn_1,
  y as y_1,
} from "./CoKk4mC0.js";
import { D as D_2, it as it_2, ot as ot_1, st as st_1 } from "./Cd-sGgPF.js";
import { D as D_3, O, f as f_1, n, w as w_1 } from "./B8_r5oP7.js";
import { o as o_2, s } from "./CioJR-lb.js";
import { r } from "./BpBaBBm3.js";
import { n as n_2 } from "./C96bnRGM.js";
import { t } from "./OaeI3Ulg.js";
import { t as t_2 } from "./CJNUlr67.js";
import { t as t_3 } from "./EoqKQiEy2.js";
import { t as t_4 } from "./BDNMzG2s2.js";
import { t as t_5 } from "./D1yN6wZY2.js";
import { t as t_6 } from "./OfUAv67B2.js";
import { t as t_7 } from "./D5Z5IiLY2.js";
import { n as n_3, t as t_8 } from "./DY43dlCC.js";
import { t as t_9 } from "./25FdeeAd.js";
import { t as t_10 } from "./DcUUodPk.js";
import { t as t_11 } from "./Cuy4t56v.js";
import { t as t_12 } from "./eDEyLi0S.js";
import { t as t_13 } from "./BvwLaU7c.js";
import { t as t_14 } from "./B_-2JulU.js";
import { n as n_4, r as r_2, t as t_15 } from "./CXuuVbXE.js";
import { t as t_16 } from "./DP8dx3Mz.js";
import { n as n_5, t as t_17 } from "./Wy_umkB72.js";
const _e = Object.assign(
  k({
    __name: `MonteCarloEquityCurve`,
    props: {
      data: {},
    },
    setup(e) {
      let t = f_1();
      let r = g(() => t.value);
      let i = vn_1();
      let a = null;
      let s = [];
      let d = e;
      Ht_1(r, (e) => {
        h(e);
      });
      ct_1(async () => {
        await f();
      });
      async function f() {
        let e = {
          ...r_2,
          width: i.value.clientWidth,
          rightPriceScale: {
            visible: true,
          },
        };
        a = t_12(i.value, e);
        let t = d.data.filter((e) => e.name === `Original`);
        let n = [...d.data.filter((e) => e.name !== `Original`), ...t];
        for (const t of n) {
          let r = t.name === `Original`;
          let i = `rgb(251, 191, 36)`;
          let o = `rgba(99, 102, 241, 0.15)`;
          let c = r
            ? {
                lineWidth: 2,
                color: i,
                priceLineVisible: true,
                lastValueVisible: true,
              }
            : {
                lineWidth: 2,
                color: o,
                priceLineVisible: false,
                lastValueVisible: false,
              };
          let l = a.addLineSeries(c);
          let u = (t.data || []).map((e) => ({
            time: e.time,
            value: e.value,
          }));
          l.setData(u);
          l.applyOptions({
            color: r ? i : o,
          });
          s.push(l);
        }
        a.timeScale().fitContent();
        h(r.value);
      }
      ft_1(() => {
        if (s && s.length > 0) {
          for (let e of s) {
            try {
              e.setData([]);
            } catch {}
          }
        }
        m();
      });
      function m() {
        if (a !== null) {
          try {
            a.remove();
          } catch (e) {
            console.error(`Error removing chart:`, e);
          }
          a = null;
        }
        s = [];
      }
      function h(e) {
        if (!(a === null || s === null)) {
          a.applyOptions(e === `light` ? n_4.chart : t_15.chart);
        }
      }
      Ht_1(
        () => d.data,
        async () => {
          m();
          await tt_1();
          await f();
        },
        {
          deep: true,
        },
      );
      return (e, t) => {
        mt_1();
        return b(
          `div`,
          {
            ref_key: `chartContainer`,
            ref: i,
            class: `rounded-sm overflow-hidden border-2 border-gray-100 dark:border-gray-600`,
          },
          null,
          512,
        );
      };
    },
  }),
  {
    __name: `MonteCarloEquityCurve`,
  },
);
const ve = s(t_11);
const ye = {
  key: 0,
  class: `mb-8`,
};
const be = {
  key: 1,
  class: `mb-8`,
};
const xe = {
  key: 2,
};
const Se = {
  key: 0,
  class: `mb-3 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs dark:border-gray-700 dark:bg-gray-900`,
};
const Ce = {
  class: `p-4`,
};
const we = {
  key: 0,
  class: `mb-6`,
};
const Te = {
  class: `flex justify-between items-center mb-2`,
};
const Ee = {
  class: `text-sm text-gray-600 dark:text-gray-400`,
};
const De = {
  key: 0,
  class: `text-sm text-gray-500 dark:text-gray-400`,
};
const Oe = {
  class: `mb-6`,
};
const ke = {
  key: 0,
};
const Ae = {
  key: 1,
  class: `rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden p-4`,
};
const je = {
  class: `space-y-2`,
};
const Me = {
  key: 1,
};
const Ne = {
  class: `rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden`,
};
const Pe = {
  class: `divide-y divide-gray-100 dark:divide-gray-800`,
};
const Fe = {
  class: `w-[25%] text-sm font-medium italic`,
};
const Ie = {
  class: `w-[18%] text-sm`,
};
const Le = {
  class: `w-[19%] text-sm`,
};
const Re = {
  class: `w-[19%] text-sm`,
};
const ze = {
  class: `w-[19%] text-sm`,
};
const Be = {
  key: 2,
};
const Ve = {
  class: `rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden`,
};
const He = {
  class: `flex justify-between border-b border-gray-200 px-4 py-2 dark:border-gray-800`,
};
const Ue = {
  class: `w-[25%]`,
};
const We = {
  class: `w-[18%]`,
};
const Ge = {
  class: `w-[19%]`,
};
const Ke = {
  class: `w-[19%]`,
};
const qe = {
  class: `w-[19%]`,
};
const Je = {
  class: `divide-y divide-gray-100 dark:divide-gray-800`,
};
const Ye = {
  class: `w-[25%]`,
};
const Xe = {
  class: `w-[18%]`,
};
const Ze = {
  class: `w-[19%]`,
};
const Qe = {
  class: `w-[19%]`,
};
const $e = {
  class: `w-[19%]`,
};
const et = {
  key: 1,
  class: `mb-3 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs dark:border-gray-700 dark:bg-gray-900`,
};
const tt = {
  class: `p-4`,
};
const nt = {
  key: 0,
  class: `mb-6`,
};
const rt = {
  class: `flex justify-between items-center mb-2`,
};
const it = {
  class: `text-sm text-gray-600 dark:text-gray-400`,
};
const at = {
  key: 0,
  class: `text-sm text-gray-500 dark:text-gray-400`,
};
const ot = {
  class: `mb-6`,
};
const st = {
  key: 0,
};
const ct = {
  key: 1,
  class: `rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden p-4`,
};
const lt = {
  class: `space-y-2`,
};
const ut = {
  key: 1,
};
const dt = {
  class: `rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden`,
};
const ft = {
  class: `divide-y divide-gray-100 dark:divide-gray-800`,
};
const pt = {
  class: `w-[25%] text-sm font-medium italic`,
};
const mt = {
  class: `w-[18%] text-sm`,
};
const ht = {
  class: `w-[19%] text-sm`,
};
const gt = {
  class: `w-[19%] text-sm`,
};
const _t = {
  class: `w-[19%] text-sm`,
};
const vt = {
  key: 2,
};
const yt = {
  class: `rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden`,
};
const bt = {
  class: `flex justify-between border-b border-gray-200 px-4 py-2 dark:border-gray-800`,
};
const xt = {
  class: `w-[25%]`,
};
const St = {
  class: `w-[18%]`,
};
const Ct = {
  class: `w-[19%]`,
};
const wt = {
  class: `w-[19%]`,
};
const Tt = {
  class: `w-[19%]`,
};
const Et = {
  class: `divide-y divide-gray-100 dark:divide-gray-800`,
};
const Dt = {
  class: `w-[25%]`,
};
const Ot = {
  class: `w-[18%]`,
};
const kt = {
  class: `w-[19%]`,
};
const At = {
  class: `w-[19%]`,
};
const jt = {
  class: `w-[19%]`,
};
const Mt = {
  key: 0,
  class: `select-none`,
};
const Nt = {
  key: 1,
  class: `select-none`,
};
const Pt = {
  class: `flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-2.5 shadow-xs dark:border-gray-700 dark:bg-gray-900`,
};
const Ft = {
  class: `mt-3 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs dark:border-gray-700 dark:bg-gray-900`,
};
const It = {
  class: `divide-y divide-gray-100 dark:divide-gray-800`,
};
const Lt = {
  key: 2,
};
const Rt = {
  class: `mt-3 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs dark:border-gray-700 dark:bg-gray-900`,
};
const zt = {
  class: `divide-y divide-gray-100 dark:divide-gray-800`,
};
const Bt = {
  key: 3,
  class: `mt-3 w-full space-y-3`,
};
const Vt = {
  class: `overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs dark:border-gray-700 dark:bg-gray-900`,
};
const Ht = {
  class: `p-3`,
};
const Ut = {
  class: `overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs dark:border-gray-700 dark:bg-gray-900`,
};
const Wt = {
  class: `p-3`,
};
const Gt = {
  class: `overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs dark:border-gray-700 dark:bg-gray-900`,
};
const Kt = {
  class: `p-3`,
};
const qt = {
  key: 4,
  class: `mt-3 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs select-none dark:border-gray-700 dark:bg-gray-900`,
};
const Jt = {
  class: `flex items-center justify-between gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-700`,
};
const Yt = {
  class: `min-w-0 truncate text-sm font-semibold text-gray-900 dark:text-white`,
};
const Xt = {
  class: `px-4 py-3.5`,
};
const Zt = {
  key: 0,
  class: `text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap`,
};
const Qt = {
  key: 1,
  class: `text-sm text-gray-400 dark:text-gray-500 italic text-center py-2`,
};
const $t = {
  class: `flex items-center justify-between`,
};
const en = {
  key: 0,
  class: `flex flex-col space-y-4`,
};
const tn = {
  class: `flex flex-col`,
};
const nn = {
  class: `flex items-center justify-between mb-2`,
};
const rn = {
  class: `flex gap-2`,
};
const an = {
  class: `border border-gray-200 dark:border-gray-800 rounded-sm`,
  style: {
    height: `500px`,
  },
};
const on = {
  class: `p-4 space-y-3`,
};
const sn = {
  key: 1,
  class: `flex flex-col space-y-4`,
};
const cn = {
  class: `flex flex-col`,
};
const ln = {
  class: `flex items-center justify-between mb-2`,
};
const un = {
  class: `flex gap-2`,
};
const dn = {
  key: 2,
  class: `text-center py-8 text-gray-500 dark:text-gray-400`,
};
const R = t_4(
  k({
    __name: `[id]`,
    setup(l) {
      r({
        title: `Monte Carlo Session - Jesse`,
      });
      let f = st_1();
      let A = ot_1();
      let M = g(() => A.params.id);
      let N = n();
      let P = g(() => N.form);
      let F = g(() => N.results);
      let I = vn_1(false);
      let L = vn_1(false);
      let R = vn_1(false);
      let z = vn_1(false);
      let B = vn_1(null);
      let V = vn_1();
      let H = vn_1(``);
      let U = vn_1(false);
      let W = vn_1(false);
      let G = g(
        () =>
          F.value.executing ||
          F.value.showResults ||
          F.value.status === `stopped` ||
          !!(
            F.value.trades?.exception?.error ||
            F.value.candles?.exception?.error
          ),
      );
      let fn = f_1();
      let K = g(() => {
        if (fn.value === `light`) {
          return `vs-light`;
        }
        return `vs-dark`;
      });
      let pn = g(() => {
        if (A.query.status) {
          return A.query.status;
        }
        return null;
      });
      let mn = g(() => ({
        automaticLayout: true,
        minimap: {
          enabled: false,
        },
        fontSize: 14,
        lineHeight: 21,
        readOnly: true,
      }));
      let q = vn_1(false);
      let J = g(() => {
        let e = [];
        let trades = F.value.trades;
        if (trades) {
          return (
            trades.original_equity_curve &&
              trades.original_equity_curve.data &&
              e.push({
                name: `Original`,
                color: `#f97316`,
                data: trades.original_equity_curve.data,
              }),
            (trades.scenario_equity_curves || []).forEach((t, n) => {
              if (t && t.data) {
                e.push({
                  name: `Scenario ${n + 1}`,
                  color: `#6366f1`,
                  data: t.data,
                });
              }
            }),
            e
          );
        }
        return e;
      });
      let Y = g(() => {
        let e = [];
        let candles = F.value.candles;
        if (candles) {
          return (
            candles.original_equity_curve &&
              candles.original_equity_curve.data &&
              e.push({
                name: `Original`,
                color: `#f97316`,
                data: candles.original_equity_curve.data,
              }),
            (candles.scenario_equity_curves || []).forEach((t, n) => {
              if (t && t.data) {
                e.push({
                  name: `Scenario ${n + 1}`,
                  color: `#6366f1`,
                  data: t.data,
                });
              }
            }),
            e
          );
        }
        return e;
      });
      ct_1(async () => {
        if (!n_2(M.value)) {
          O(`error`, `Invalid Monte Carlo session ID`);
          await f.replace(`/monte-carlo/`);
          return;
        }
        let e = () => {
          N.clearCurrentSession?.();
        };
        let t = () => {
          if (document.hidden) {
            H.value = ``;
            B.value = null;
          }
        };
        window.addEventListener(`beforeunload`, e);
        document.addEventListener(`visibilitychange`, t);
        it_1(() => {
          window.removeEventListener(`beforeunload`, e);
          document.removeEventListener(`visibilitychange`, t);
          if (V.value?.$editor) {
            try {
              V.value.$editor.dispose();
            } catch (e) {
              console.error(`Error disposing editor:`, e);
            }
          }
          V.value = undefined;
          H.value = ``;
          B.value = null;
          F.value.infoLogs = ``;
          F.value.trades.original_equity_curve = null;
          F.value.trades.scenario_equity_curves = [];
          F.value.candles.original_equity_curve = null;
          F.value.candles.scenario_equity_curves = [];
          if (N.clearCurrentSession) {
            N.clearCurrentSession();
          }
          N.clearCurrentSession?.();
        });
        setTimeout(async () => {
          N.clearCurrentSession();
          await N.loadSession(M.value);
          if (
            N.results.status === `terminated` ||
            N.results.status === `stopped`
          ) {
            q.value = true;
          } else {
            q.value = false;
          }
          if (pn.value) {
            await f.replace(`/monte-carlo/${M.value}`);
          }
          await X();
        }, 100);
      });
      D_2(() => {
        N.clearCurrentSession?.();
        H.value = ``;
        B.value = null;
        return true;
      });
      async function X() {
        if (M.value) {
          try {
            let e = await N.getSessionData(M.value);
            if (e) {
              B.value = e;
            }
          } catch (e) {
            console.error(`Error fetching session data:`, e);
          }
        }
      }
      Ht_1(
        () => N.results.status,
        (e) => {
          if (e === `terminated` || e === `stopped`) {
            q.value = true;
          } else {
            q.value = false;
          }
        },
      );
      Ht_1(K, (theme) => {
        V.value?.$editor?.updateOptions({
          theme,
        });
      });
      Ht_1(z, async (e) => {
        if (e) {
          U.value = true;
          await tt_1();
          if (M.value && H.value === ``) {
            let e = await N.getStrategyCode(M.value);
            if (e) {
              H.value = Object.values(e)[0];
            }
          }
          setTimeout(() => {
            if (V.value?.$editor) {
              V.value.$editor.updateOptions({
                theme: K.value,
              });
            }
          }, 50);
        }
        U.value = false;
      });
      Ht_1(W, async (e) => {
        if (e && M.value && !F.value.infoLogs.length) {
          let e = await N.getSessionLogs(M.value);
          if (e) {
            F.value.infoLogs = e;
          }
        }
      });
      Ht_1(R, async (e) => {
        if (e) {
          await X();
        }
      });
      function hn() {
        w_1.copyToClipboard(F.value.infoLogs);
        O(`success`, `Info logs copied successfully`);
        L.value = true;
        setTimeout(() => {
          L.value = false;
        }, 3000);
      }
      async function gn() {
        await N.terminate();
      }
      async function _n() {
        await N.resume();
      }
      function Z() {
        N.newSession();
        it_2(`/monte-carlo/`);
      }
      let vn = (e) => {
        let t = [];
        e.forEach((e) => {
          t.push([
            {
              value: e.symbol,
              style: ``,
            },
            {
              value: e.timeframe,
              style: ``,
            },
            {
              value: e.strategy,
              style: ``,
            },
          ]);
        });
        return t;
      };
      let yn = (e) => [
        [`Start Date`, e.start_date],
        [`Finish Date`, e.finish_date],
      ];
      function bn(e) {
        return (
          {
            total_return: `Return`,
            max_drawdown: `Max Drawdown`,
            sharpe_ratio: `Sharpe Ratio`,
            calmar_ratio: `Calmar Ratio`,
            net_profit_percentage: `Net Profit`,
            win_rate: `Win Rate`,
            total: `Total Trades`,
            annual_return: `Annual Return`,
          }[e] || e.replace(/_/g, ` `).replace(/\b\w/g, (e) => e.toUpperCase())
        );
      }
      function Q(e, t) {
        if (t == null) {
          return `N/A`;
        }
        if (
          e === `total_return` ||
          e === `net_profit_percentage` ||
          e === `annual_return` ||
          e === `max_drawdown`
        ) {
          return `${t.toFixed(1)}%`;
        }
        if (e === `win_rate`) {
          return `${(t * 100).toFixed(1)}%`;
        }
        if (e === `sharpe_ratio` || e === `calmar_ratio`) {
          return t.toFixed(2);
        }
        if (e === `total`) {
          return Math.round(t).toString();
        }
        return t.toFixed(2);
      }
      async function xn() {
        try {
          await navigator.clipboard.writeText(H.value);
          O(`success`, `Strategy code copied to clipboard`);
        } catch (e) {
          D_3(e);
        }
      }
      function Sn() {
        let e = P.value.routes[0]?.strategy;
        if (e) {
          $(`/strategies/${e}`);
        } else {
          O(`error`, `No strategy selected`);
        }
      }
      async function onSaved() {
        await X();
      }
      function $(e) {
        f.push(e);
      }
      return (n, c) => {
        let l = t_14;
        let u = t_6;
        let d = n_3;
        let f = t_3;
        let _ = _e;
        let y = t_9;
        let x = t_2;
        let S = t_8;
        let C = t_7;
        let w = t_13;
        let T = t_10;
        let E = t_16;
        let D = ve;
        let O = o_2;
        let A = t_5;
        let j = t;
        mt_1();
        return b(
          o,
          null,
          [
            D_1(
              u,
              {
                modelValue: W.value,
                "onUpdate:modelValue": (c[0] ||= (e) => (W.value = e)),
                title: `Logs`,
              },
              {
                default: qt_1(() => [
                  D_1(
                    l,
                    {
                      logs: F.value.infoLogs,
                    },
                    null,
                    8,
                    [`logs`],
                  ),
                ]),
                buttons: qt_1(() => [
                  __1(
                    `button`,
                    {
                      class: `ml-2 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-hidden`,
                      onClick: hn,
                    },
                    [
                      L.value
                        ? (mt_1(),
                          v(On(n_5), {
                            key: 0,
                            class: `h-6 w-6`,
                            "aria-hidden": `true`,
                          }))
                        : y_1(``, true),
                      !L.value && F.value.infoLogs.length != 0
                        ? (mt_1(),
                          v(On(t_17), {
                            key: 1,
                            class: `h-6 w-6`,
                            "aria-hidden": `true`,
                          }))
                        : y_1(``, true),
                    ],
                  ),
                ]),
                _: 1,
              },
              8,
              [`modelValue`],
            ),
            __1(
              `div`,
              {
                class: Qn([`flex-1 flex flex-col`, G.value ? `p-3` : ``]),
              },
              [
                __1(
                  `div`,
                  {
                    class: Qn([
                      `flex-1`,
                      G.value
                        ? `rounded-2xl border border-gray-200 bg-gray-100/70 dark:border-gray-800 dark:bg-gray-950`
                        : ``,
                    ]),
                  },
                  [
                    D_1(
                      T,
                      {
                        compact: G.value,
                      },
                      {
                        left: qt_1(() => [
                          F.value.trades?.exception?.error
                            ? (mt_1(),
                              b(`div`, ye, [
                                D_1(
                                  d,
                                  {
                                    modelValue: I.value,
                                    "onUpdate:modelValue": (c[1] ||= (e) =>
                                      (I.value = e)),
                                    title: `Trades Simulation Error`,
                                    content:
                                      F.value.trades?.exception?.traceback ||
                                      F.value.trades?.exception?.error,
                                    mode: `monte-carlo`,
                                  },
                                  null,
                                  8,
                                  [`modelValue`, `content`],
                                ),
                              ]))
                            : y_1(``, true),
                          F.value.candles?.exception?.error
                            ? (mt_1(),
                              b(`div`, be, [
                                D_1(
                                  d,
                                  {
                                    modelValue: I.value,
                                    "onUpdate:modelValue": (c[2] ||= (e) =>
                                      (I.value = e)),
                                    title: `Candles Simulation Error`,
                                    content:
                                      F.value.candles?.exception?.traceback ||
                                      F.value.candles?.exception?.error,
                                    mode: `monte-carlo`,
                                  },
                                  null,
                                  8,
                                  [`modelValue`, `content`],
                                ),
                              ]))
                            : y_1(``, true),
                          (F.value.executing || F.value.showResults) &&
                          !(
                            F.value.candles?.exception?.error ||
                            F.value.trades?.exception?.error
                          )
                            ? (mt_1(),
                              b(`div`, xe, [
                                P.value.run_trades
                                  ? (mt_1(),
                                    b(`div`, Se, [
                                      (c[19] ||= __1(
                                        `div`,
                                        {
                                          class: `border-b border-gray-200 px-4 py-3 dark:border-gray-700`,
                                        },
                                        [
                                          __1(
                                            `h3`,
                                            {
                                              class: `text-sm font-semibold text-gray-900 dark:text-white`,
                                            },
                                            `🔀 Monte Carlo trades`,
                                          ),
                                        ],
                                        -1,
                                      )),
                                      __1(`div`, Ce, [
                                        F.value.trades.progressbar.total > 0 &&
                                        F.value.trades.progressbar.current <
                                          F.value.trades.progressbar.total
                                          ? (mt_1(),
                                            b(`div`, we, [
                                              __1(`div`, Te, [
                                                __1(
                                                  `p`,
                                                  Ee,
                                                  ` Running Trades Simulation... (` +
                                                    nr(
                                                      F.value.trades.progressbar
                                                        .current,
                                                    ) +
                                                    `/` +
                                                    nr(
                                                      F.value.trades.progressbar
                                                        .total,
                                                    ) +
                                                    `) `,
                                                  1,
                                                ),
                                                F.value.trades.progressbar
                                                  .estimated_remaining_seconds >
                                                0
                                                  ? (mt_1(),
                                                    b(
                                                      `p`,
                                                      De,
                                                      nr(
                                                        On(
                                                          w_1,
                                                        ).remainingTimeText(
                                                          F.value.trades
                                                            .progressbar
                                                            .estimated_remaining_seconds,
                                                        ),
                                                      ),
                                                      1,
                                                    ))
                                                  : y_1(``, true),
                                              ]),
                                              D_1(
                                                f,
                                                {
                                                  "model-value":
                                                    F.value.trades.progressbar
                                                      .current,
                                                  max: F.value.trades
                                                    .progressbar.total,
                                                  size: `lg`,
                                                  color: `primary`,
                                                },
                                                null,
                                                8,
                                                [`model-value`, `max`],
                                              ),
                                            ]))
                                          : y_1(``, true),
                                        __1(`div`, Oe, [
                                          J.value.length
                                            ? (mt_1(),
                                              b(`div`, ke, [
                                                D_1(
                                                  _,
                                                  {
                                                    data: J.value,
                                                  },
                                                  null,
                                                  8,
                                                  [`data`],
                                                ),
                                              ]))
                                            : (mt_1(),
                                              b(`div`, Ae, [
                                                __1(`div`, je, [
                                                  D_1(y, {
                                                    class: `h-8 w-3/4`,
                                                  }),
                                                  D_1(y, {
                                                    class: `h-8 w-full`,
                                                  }),
                                                  D_1(y, {
                                                    class: `h-8 w-5/6`,
                                                  }),
                                                  D_1(y, {
                                                    class: `h-8 w-full`,
                                                  }),
                                                  D_1(y, {
                                                    class: `h-8 w-4/5`,
                                                  }),
                                                  D_1(y, {
                                                    class: `h-8 w-full`,
                                                  }),
                                                  D_1(y, {
                                                    class: `h-8 w-3/4`,
                                                  }),
                                                  D_1(y, {
                                                    class: `h-8 w-full`,
                                                  }),
                                                  D_1(y, {
                                                    class: `h-8 w-5/6`,
                                                  }),
                                                  D_1(y, {
                                                    class: `h-8 w-full`,
                                                  }),
                                                  D_1(y, {
                                                    class: `h-8 w-4/5`,
                                                  }),
                                                  D_1(y, {
                                                    class: `h-8 w-full`,
                                                  }),
                                                ]),
                                              ])),
                                        ]),
                                        F.value.trades.summary_metrics.length
                                          ? (mt_1(),
                                            b(`div`, Me, [
                                              __1(`div`, Ne, [
                                                (c[18] ||= __1(
                                                  `div`,
                                                  {
                                                    class: `flex justify-between border-b border-gray-200 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:border-gray-800 dark:text-gray-500`,
                                                  },
                                                  [
                                                    __1(
                                                      `div`,
                                                      {
                                                        class: `w-[25%]`,
                                                      },
                                                      `Metric`,
                                                    ),
                                                    __1(
                                                      `div`,
                                                      {
                                                        class: `w-[18%]`,
                                                      },
                                                      `Original`,
                                                    ),
                                                    __1(
                                                      `div`,
                                                      {
                                                        class: `w-[19%]`,
                                                      },
                                                      `Worst 5%`,
                                                    ),
                                                    __1(
                                                      `div`,
                                                      {
                                                        class: `w-[19%]`,
                                                      },
                                                      `Median`,
                                                    ),
                                                    __1(
                                                      `div`,
                                                      {
                                                        class: `w-[19%]`,
                                                      },
                                                      `Best 5%`,
                                                    ),
                                                  ],
                                                  -1,
                                                )),
                                                __1(`div`, Pe, [
                                                  (mt_1(true),
                                                  b(
                                                    o,
                                                    null,
                                                    bt_1(
                                                      F.value.trades
                                                        .summary_metrics,
                                                      (e, t) => {
                                                        mt_1();
                                                        return b(
                                                          `div`,
                                                          {
                                                            key: t,
                                                            class: `flex justify-between p-4`,
                                                          },
                                                          [
                                                            __1(
                                                              `div`,
                                                              Fe,
                                                              nr(bn(e.metric)),
                                                              1,
                                                            ),
                                                            __1(
                                                              `div`,
                                                              Ie,
                                                              nr(
                                                                Q(
                                                                  e.metric,
                                                                  e.original,
                                                                ),
                                                              ),
                                                              1,
                                                            ),
                                                            __1(
                                                              `div`,
                                                              Le,
                                                              nr(
                                                                Q(
                                                                  e.metric,
                                                                  e.worst_5,
                                                                ),
                                                              ),
                                                              1,
                                                            ),
                                                            __1(
                                                              `div`,
                                                              Re,
                                                              nr(
                                                                Q(
                                                                  e.metric,
                                                                  e.median,
                                                                ),
                                                              ),
                                                              1,
                                                            ),
                                                            __1(
                                                              `div`,
                                                              ze,
                                                              nr(
                                                                Q(
                                                                  e.metric,
                                                                  e.best_5,
                                                                ),
                                                              ),
                                                              1,
                                                            ),
                                                          ],
                                                        );
                                                      },
                                                    ),
                                                    128,
                                                  )),
                                                ]),
                                              ]),
                                            ]))
                                          : (mt_1(),
                                            b(`div`, Be, [
                                              __1(`div`, Ve, [
                                                __1(`div`, He, [
                                                  __1(`div`, Ue, [
                                                    D_1(y, {
                                                      class: `h-4 w-20`,
                                                    }),
                                                  ]),
                                                  __1(`div`, We, [
                                                    D_1(y, {
                                                      class: `h-4 w-16`,
                                                    }),
                                                  ]),
                                                  __1(`div`, Ge, [
                                                    D_1(y, {
                                                      class: `h-4 w-16`,
                                                    }),
                                                  ]),
                                                  __1(`div`, Ke, [
                                                    D_1(y, {
                                                      class: `h-4 w-16`,
                                                    }),
                                                  ]),
                                                  __1(`div`, qe, [
                                                    D_1(y, {
                                                      class: `h-4 w-16`,
                                                    }),
                                                  ]),
                                                ]),
                                                __1(`div`, Je, [
                                                  (mt_1(),
                                                  b(
                                                    o,
                                                    null,
                                                    bt_1(4, (t) =>
                                                      __1(
                                                        `div`,
                                                        {
                                                          key: t,
                                                          class: `flex justify-between p-4`,
                                                        },
                                                        [
                                                          __1(`div`, Ye, [
                                                            D_1(y, {
                                                              class: `h-4 w-24`,
                                                            }),
                                                          ]),
                                                          __1(`div`, Xe, [
                                                            D_1(y, {
                                                              class: `h-4 w-16`,
                                                            }),
                                                          ]),
                                                          __1(`div`, Ze, [
                                                            D_1(y, {
                                                              class: `h-4 w-16`,
                                                            }),
                                                          ]),
                                                          __1(`div`, Qe, [
                                                            D_1(y, {
                                                              class: `h-4 w-16`,
                                                            }),
                                                          ]),
                                                          __1(`div`, $e, [
                                                            D_1(y, {
                                                              class: `h-4 w-16`,
                                                            }),
                                                          ]),
                                                        ],
                                                      ),
                                                    ),
                                                    64,
                                                  )),
                                                ]),
                                              ]),
                                            ])),
                                      ]),
                                    ]))
                                  : y_1(``, true),
                                P.value.run_candles
                                  ? (mt_1(),
                                    b(`div`, et, [
                                      (c[21] ||= __1(
                                        `div`,
                                        {
                                          class: `border-b border-gray-200 px-4 py-3 dark:border-gray-700`,
                                        },
                                        [
                                          __1(
                                            `h3`,
                                            {
                                              class: `text-sm font-semibold text-gray-900 dark:text-white`,
                                            },
                                            `📈 Monte Carlo candles`,
                                          ),
                                        ],
                                        -1,
                                      )),
                                      __1(`div`, tt, [
                                        F.value.candles.progressbar.total > 0 &&
                                        F.value.candles.progressbar.current <
                                          F.value.candles.progressbar.total
                                          ? (mt_1(),
                                            b(`div`, nt, [
                                              __1(`div`, rt, [
                                                __1(
                                                  `p`,
                                                  it,
                                                  ` Running Candles Simulation... (` +
                                                    nr(
                                                      F.value.candles
                                                        .progressbar.current,
                                                    ) +
                                                    `/` +
                                                    nr(
                                                      F.value.candles
                                                        .progressbar.total,
                                                    ) +
                                                    `) `,
                                                  1,
                                                ),
                                                F.value.candles.progressbar
                                                  .estimated_remaining_seconds >
                                                0
                                                  ? (mt_1(),
                                                    b(
                                                      `p`,
                                                      at,
                                                      nr(
                                                        On(
                                                          w_1,
                                                        ).remainingTimeText(
                                                          F.value.candles
                                                            .progressbar
                                                            .estimated_remaining_seconds,
                                                        ),
                                                      ),
                                                      1,
                                                    ))
                                                  : y_1(``, true),
                                              ]),
                                              D_1(
                                                f,
                                                {
                                                  "model-value":
                                                    F.value.candles.progressbar
                                                      .current,
                                                  max: F.value.candles
                                                    .progressbar.total,
                                                  size: `lg`,
                                                  color: `primary`,
                                                },
                                                null,
                                                8,
                                                [`model-value`, `max`],
                                              ),
                                            ]))
                                          : y_1(``, true),
                                        __1(`div`, ot, [
                                          Y.value.length
                                            ? (mt_1(),
                                              b(`div`, st, [
                                                D_1(
                                                  _,
                                                  {
                                                    data: Y.value,
                                                  },
                                                  null,
                                                  8,
                                                  [`data`],
                                                ),
                                              ]))
                                            : (mt_1(),
                                              b(`div`, ct, [
                                                __1(`div`, lt, [
                                                  D_1(y, {
                                                    class: `h-8 w-3/4`,
                                                  }),
                                                  D_1(y, {
                                                    class: `h-8 w-full`,
                                                  }),
                                                  D_1(y, {
                                                    class: `h-8 w-5/6`,
                                                  }),
                                                  D_1(y, {
                                                    class: `h-8 w-full`,
                                                  }),
                                                  D_1(y, {
                                                    class: `h-8 w-4/5`,
                                                  }),
                                                  D_1(y, {
                                                    class: `h-8 w-full`,
                                                  }),
                                                  D_1(y, {
                                                    class: `h-8 w-3/4`,
                                                  }),
                                                  D_1(y, {
                                                    class: `h-8 w-full`,
                                                  }),
                                                  D_1(y, {
                                                    class: `h-8 w-5/6`,
                                                  }),
                                                  D_1(y, {
                                                    class: `h-8 w-full`,
                                                  }),
                                                  D_1(y, {
                                                    class: `h-8 w-4/5`,
                                                  }),
                                                  D_1(y, {
                                                    class: `h-8 w-full`,
                                                  }),
                                                ]),
                                              ])),
                                        ]),
                                        F.value.candles.summary_metrics.length
                                          ? (mt_1(),
                                            b(`div`, ut, [
                                              __1(`div`, dt, [
                                                (c[20] ||= __1(
                                                  `div`,
                                                  {
                                                    class: `flex justify-between border-b border-gray-200 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:border-gray-800 dark:text-gray-500`,
                                                  },
                                                  [
                                                    __1(
                                                      `div`,
                                                      {
                                                        class: `w-[25%]`,
                                                      },
                                                      `Metric`,
                                                    ),
                                                    __1(
                                                      `div`,
                                                      {
                                                        class: `w-[18%]`,
                                                      },
                                                      `Original`,
                                                    ),
                                                    __1(
                                                      `div`,
                                                      {
                                                        class: `w-[19%]`,
                                                      },
                                                      `Worst 5%`,
                                                    ),
                                                    __1(
                                                      `div`,
                                                      {
                                                        class: `w-[19%]`,
                                                      },
                                                      `Median`,
                                                    ),
                                                    __1(
                                                      `div`,
                                                      {
                                                        class: `w-[19%]`,
                                                      },
                                                      `Best 5%`,
                                                    ),
                                                  ],
                                                  -1,
                                                )),
                                                __1(`div`, ft, [
                                                  (mt_1(true),
                                                  b(
                                                    o,
                                                    null,
                                                    bt_1(
                                                      F.value.candles
                                                        .summary_metrics,
                                                      (e, t) => {
                                                        mt_1();
                                                        return b(
                                                          `div`,
                                                          {
                                                            key: t,
                                                            class: `flex justify-between p-4`,
                                                          },
                                                          [
                                                            __1(
                                                              `div`,
                                                              pt,
                                                              nr(bn(e.metric)),
                                                              1,
                                                            ),
                                                            __1(
                                                              `div`,
                                                              mt,
                                                              nr(
                                                                Q(
                                                                  e.metric,
                                                                  e.original,
                                                                ),
                                                              ),
                                                              1,
                                                            ),
                                                            __1(
                                                              `div`,
                                                              ht,
                                                              nr(
                                                                Q(
                                                                  e.metric,
                                                                  e.worst_5,
                                                                ),
                                                              ),
                                                              1,
                                                            ),
                                                            __1(
                                                              `div`,
                                                              gt,
                                                              nr(
                                                                Q(
                                                                  e.metric,
                                                                  e.median,
                                                                ),
                                                              ),
                                                              1,
                                                            ),
                                                            __1(
                                                              `div`,
                                                              _t,
                                                              nr(
                                                                Q(
                                                                  e.metric,
                                                                  e.best_5,
                                                                ),
                                                              ),
                                                              1,
                                                            ),
                                                          ],
                                                        );
                                                      },
                                                    ),
                                                    128,
                                                  )),
                                                ]),
                                              ]),
                                            ]))
                                          : (mt_1(),
                                            b(`div`, vt, [
                                              __1(`div`, yt, [
                                                __1(`div`, bt, [
                                                  __1(`div`, xt, [
                                                    D_1(y, {
                                                      class: `h-4 w-20`,
                                                    }),
                                                  ]),
                                                  __1(`div`, St, [
                                                    D_1(y, {
                                                      class: `h-4 w-16`,
                                                    }),
                                                  ]),
                                                  __1(`div`, Ct, [
                                                    D_1(y, {
                                                      class: `h-4 w-16`,
                                                    }),
                                                  ]),
                                                  __1(`div`, wt, [
                                                    D_1(y, {
                                                      class: `h-4 w-16`,
                                                    }),
                                                  ]),
                                                  __1(`div`, Tt, [
                                                    D_1(y, {
                                                      class: `h-4 w-16`,
                                                    }),
                                                  ]),
                                                ]),
                                                __1(`div`, Et, [
                                                  (mt_1(),
                                                  b(
                                                    o,
                                                    null,
                                                    bt_1(4, (t) =>
                                                      __1(
                                                        `div`,
                                                        {
                                                          key: t,
                                                          class: `flex justify-between p-4`,
                                                        },
                                                        [
                                                          __1(`div`, Dt, [
                                                            D_1(y, {
                                                              class: `h-4 w-24`,
                                                            }),
                                                          ]),
                                                          __1(`div`, Ot, [
                                                            D_1(y, {
                                                              class: `h-4 w-16`,
                                                            }),
                                                          ]),
                                                          __1(`div`, kt, [
                                                            D_1(y, {
                                                              class: `h-4 w-16`,
                                                            }),
                                                          ]),
                                                          __1(`div`, At, [
                                                            D_1(y, {
                                                              class: `h-4 w-16`,
                                                            }),
                                                          ]),
                                                          __1(`div`, jt, [
                                                            D_1(y, {
                                                              class: `h-4 w-16`,
                                                            }),
                                                          ]),
                                                        ],
                                                      ),
                                                    ),
                                                    64,
                                                  )),
                                                ]),
                                              ]),
                                            ])),
                                      ]),
                                    ]))
                                  : y_1(``, true),
                              ]))
                            : y_1(``, true),
                        ]),
                        right: qt_1(() => [
                          F.value.trades?.exception?.error ||
                          F.value.candles?.exception?.error ||
                          F.value.status === `stopped`
                            ? (mt_1(),
                              b(`div`, Mt, [
                                D_1(x, {
                                  class: `w-full flex justify-center`,
                                  icon: `i-heroicons-plus`,
                                  variant: `soft`,
                                  color: `neutral`,
                                  label: `New session`,
                                  trailing: false,
                                  onClick: (c[3] ||= (e) => Z()),
                                }),
                              ]))
                            : F.value.executing && !F.value.showResults
                              ? (mt_1(),
                                b(`div`, Nt, [
                                  __1(`div`, Pt, [
                                    (c[22] ||= __1(
                                      `div`,
                                      {
                                        class: `flex min-w-0 items-center gap-2.5`,
                                      },
                                      [
                                        __1(
                                          `span`,
                                          {
                                            class: `relative flex size-2 shrink-0`,
                                          },
                                          [
                                            __1(`span`, {
                                              class: `absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75`,
                                            }),
                                            __1(`span`, {
                                              class: `relative inline-flex size-2 rounded-full bg-emerald-500`,
                                            }),
                                          ],
                                        ),
                                        __1(
                                          `span`,
                                          {
                                            class: `truncate text-sm font-semibold text-gray-900 dark:text-white`,
                                          },
                                          `Simulating`,
                                        ),
                                      ],
                                      -1,
                                    )),
                                    D_1(
                                      x,
                                      {
                                        size: `xs`,
                                        color: `neutral`,
                                        variant: `ghost`,
                                        icon: `i-heroicons-no-symbol`,
                                        label: `Terminate`,
                                        class: `shrink-0 text-rose-500 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10`,
                                        disabled:
                                          (F.value.trades?.progressbar
                                            ?.current ?? 0) === 0 &&
                                          (F.value.candles?.progressbar
                                            ?.current ?? 0) === 0,
                                        onClick: (c[4] ||= (e) => gn()),
                                      },
                                      null,
                                      8,
                                      [`disabled`],
                                    ),
                                  ]),
                                  __1(`div`, Ft, [
                                    __1(`div`, It, [
                                      D_1(S, {
                                        label: `Logs`,
                                        icon: `i-heroicons-document-text`,
                                        onClick: (c[5] ||= (e) =>
                                          (W.value = true)),
                                      }),
                                      D_1(S, {
                                        label: `History`,
                                        icon: `i-heroicons-clock`,
                                        onClick: (c[6] ||= (e) =>
                                          $(`/monte-carlo/history`)),
                                      }),
                                      D_1(S, {
                                        label: `View strategy`,
                                        icon: `i-heroicons-code-bracket`,
                                        onClick: (c[7] ||= (e) =>
                                          (z.value = true)),
                                      }),
                                    ]),
                                  ]),
                                ]))
                              : F.value.showResults
                                ? (mt_1(),
                                  b(`div`, Lt, [
                                    __1(
                                      `div`,
                                      {
                                        class: Qn([
                                          `grid gap-3`,
                                          q.value
                                            ? `grid-cols-2`
                                            : `grid-cols-1`,
                                        ]),
                                      },
                                      [
                                        q.value
                                          ? (mt_1(),
                                            v(x, {
                                              key: 0,
                                              class: `flex justify-center`,
                                              icon: `i-heroicons-play`,
                                              variant: `solid`,
                                              color: `primary`,
                                              label: `Resume`,
                                              trailing: false,
                                              onClick: (c[8] ||= (e) => _n()),
                                            }))
                                          : y_1(``, true),
                                        D_1(
                                          x,
                                          {
                                            class: `flex justify-center`,
                                            icon: `i-heroicons-plus`,
                                            variant: q.value ? `soft` : `solid`,
                                            color: q.value
                                              ? `neutral`
                                              : `primary`,
                                            label: `New session`,
                                            trailing: false,
                                            onClick: (c[9] ||= (e) => Z()),
                                          },
                                          null,
                                          8,
                                          [`variant`, `color`],
                                        ),
                                      ],
                                      2,
                                    ),
                                    __1(`div`, Rt, [
                                      __1(`div`, zt, [
                                        D_1(S, {
                                          label: `Logs`,
                                          icon: `i-heroicons-document-text`,
                                          onClick: (c[10] ||= (e) =>
                                            (W.value = true)),
                                        }),
                                        D_1(S, {
                                          label: `History`,
                                          icon: `i-heroicons-clock`,
                                          onClick: (c[11] ||= (e) =>
                                            $(`/monte-carlo/history`)),
                                        }),
                                        D_1(S, {
                                          label: `View strategy`,
                                          icon: `i-heroicons-code-bracket`,
                                          onClick: (c[12] ||= (e) =>
                                            (z.value = true)),
                                        }),
                                      ]),
                                    ]),
                                  ]))
                                : y_1(``, true),
                          G.value && F.value.generalInfo.length
                            ? (mt_1(),
                              b(`div`, Bt, [
                                __1(`div`, Vt, [
                                  (c[23] ||= __1(
                                    `div`,
                                    {
                                      class: `border-b border-gray-200 px-4 py-3 dark:border-gray-700`,
                                    },
                                    [
                                      __1(
                                        `h3`,
                                        {
                                          class: `text-sm font-semibold text-gray-900 dark:text-white`,
                                        },
                                        `Info`,
                                      ),
                                    ],
                                    -1,
                                  )),
                                  __1(`div`, Ht, [
                                    D_1(
                                      C,
                                      {
                                        data: F.value.generalInfo,
                                      },
                                      null,
                                      8,
                                      [`data`],
                                    ),
                                  ]),
                                ]),
                                __1(`div`, Ut, [
                                  (c[24] ||= __1(
                                    `div`,
                                    {
                                      class: `border-b border-gray-200 px-4 py-3 dark:border-gray-700`,
                                    },
                                    [
                                      __1(
                                        `h3`,
                                        {
                                          class: `text-sm font-semibold text-gray-900 dark:text-white`,
                                        },
                                        `Duration`,
                                      ),
                                    ],
                                    -1,
                                  )),
                                  __1(`div`, Wt, [
                                    D_1(
                                      C,
                                      {
                                        data: yn(P.value),
                                      },
                                      null,
                                      8,
                                      [`data`],
                                    ),
                                  ]),
                                ]),
                                __1(`div`, Gt, [
                                  (c[25] ||= __1(
                                    `div`,
                                    {
                                      class: `border-b border-gray-200 px-4 py-3 dark:border-gray-700`,
                                    },
                                    [
                                      __1(
                                        `h3`,
                                        {
                                          class: `text-sm font-semibold text-gray-900 dark:text-white`,
                                        },
                                        `Routes`,
                                      ),
                                    ],
                                    -1,
                                  )),
                                  __1(`div`, Kt, [
                                    D_1(
                                      w,
                                      {
                                        data: vn(P.value.routes),
                                        "header-items": [
                                          `Symbol`,
                                          `Timeframe`,
                                          `Strategy`,
                                        ],
                                        header: ``,
                                      },
                                      null,
                                      8,
                                      [`data`],
                                    ),
                                  ]),
                                ]),
                              ]))
                            : y_1(``, true),
                          G.value
                            ? (mt_1(),
                              b(`div`, qt, [
                                __1(`div`, Jt, [
                                  __1(
                                    `h3`,
                                    Yt,
                                    nr(B.value?.title || `Session notes`),
                                    1,
                                  ),
                                  D_1(x, {
                                    variant: `link`,
                                    color: `neutral`,
                                    icon: `i-heroicons-pencil-square`,
                                    size: `xs`,
                                    class: `shrink-0`,
                                    onClick: (c[13] ||= (e) =>
                                      (R.value = true)),
                                  }),
                                ]),
                                __1(`div`, Xt, [
                                  B.value?.description
                                    ? (mt_1(),
                                      b(`div`, Zt, nr(B.value.description), 1))
                                    : (mt_1(),
                                      b(
                                        `div`,
                                        Qt,
                                        ` No notes yet. Click the edit button to add notes. `,
                                      )),
                                ]),
                              ]))
                            : y_1(``, true),
                        ]),
                        _: 1,
                      },
                      8,
                      [`compact`],
                    ),
                  ],
                  2,
                ),
              ],
              2,
            ),
            D_1(
              E,
              {
                modelValue: R.value,
                "onUpdate:modelValue": (c[14] ||= (e) => (R.value = e)),
                "session-id": M.value,
                "initial-title": B.value?.title,
                "initial-description": B.value?.description,
                onSaved,
              },
              null,
              8,
              [
                `modelValue`,
                `session-id`,
                `initial-title`,
                `initial-description`,
              ],
            ),
            D_1(
              j,
              {
                open: z.value,
                "onUpdate:open": (c[17] ||= (e) => (z.value = e)),
                ui: {
                  content: `sm:max-w-5xl`,
                },
              },
              {
                content: qt_1(() => [
                  D_1(A, null, {
                    header: qt_1(() => [
                      __1(`div`, $t, [
                        (c[26] ||= __1(
                          `h3`,
                          {
                            class: `text-lg font-semibold`,
                          },
                          `Strategy Code Snapshot`,
                          -1,
                        )),
                        D_1(x, {
                          color: `neutral`,
                          variant: `ghost`,
                          icon: `i-heroicons-x-mark`,
                          size: `sm`,
                          onClick: (c[15] ||= (e) => (z.value = false)),
                        }),
                      ]),
                    ]),
                    default: qt_1(() => [
                      U.value
                        ? (mt_1(),
                          b(`div`, en, [
                            __1(`div`, tn, [
                              __1(`div`, nn, [
                                D_1(y, {
                                  class: `h-4 w-20`,
                                }),
                                __1(`div`, rn, [
                                  D_1(y, {
                                    class: `h-8 w-16`,
                                  }),
                                  D_1(y, {
                                    class: `h-8 w-32`,
                                  }),
                                ]),
                              ]),
                              __1(`div`, an, [
                                __1(`div`, on, [
                                  D_1(y, {
                                    class: `h-4 w-full`,
                                  }),
                                  D_1(y, {
                                    class: `h-4 w-5/6`,
                                  }),
                                  D_1(y, {
                                    class: `h-4 w-4/5`,
                                  }),
                                  D_1(y, {
                                    class: `h-4 w-full`,
                                  }),
                                  D_1(y, {
                                    class: `h-4 w-3/4`,
                                  }),
                                  D_1(y, {
                                    class: `h-4 w-full`,
                                  }),
                                  D_1(y, {
                                    class: `h-4 w-2/3`,
                                  }),
                                  D_1(y, {
                                    class: `h-4 w-5/6`,
                                  }),
                                  D_1(y, {
                                    class: `h-4 w-full`,
                                  }),
                                  D_1(y, {
                                    class: `h-4 w-4/5`,
                                  }),
                                  D_1(y, {
                                    class: `h-4 w-1/2`,
                                  }),
                                  D_1(y, {
                                    class: `h-4 w-3/4`,
                                  }),
                                  D_1(y, {
                                    class: `h-4 w-full`,
                                  }),
                                  D_1(y, {
                                    class: `h-4 w-5/6`,
                                  }),
                                  D_1(y, {
                                    class: `h-4 w-2/3`,
                                  }),
                                ]),
                              ]),
                            ]),
                          ]))
                        : H.value && H.value.length > 0
                          ? (mt_1(),
                            b(`div`, sn, [
                              __1(`div`, cn, [
                                __1(`div`, ln, [
                                  (c[27] ||= __1(
                                    `label`,
                                    {
                                      class: `block text-sm font-medium`,
                                    },
                                    null,
                                    -1,
                                  )),
                                  __1(`div`, un, [
                                    D_1(x, {
                                      icon: `i-heroicons-clipboard-document`,
                                      label: `Copy`,
                                      variant: `soft`,
                                      color: `neutral`,
                                      size: `sm`,
                                      onClick: xn,
                                    }),
                                    D_1(x, {
                                      icon: `i-heroicons-pencil-square`,
                                      label: `Go to Strategy Editor`,
                                      variant: `soft`,
                                      color: `primary`,
                                      size: `sm`,
                                      onClick: Sn,
                                    }),
                                  ]),
                                ]),
                                D_1(O, null, {
                                  default: qt_1(() => [
                                    D_1(
                                      D,
                                      {
                                        ref_key: `codeEditorRef`,
                                        ref: V,
                                        modelValue: H.value,
                                        "onUpdate:modelValue": (c[16] ||= (e) =>
                                          (H.value = e)),
                                        lang: `python`,
                                        options: mn.value,
                                        class: `border border-gray-200 dark:border-gray-800 rounded-sm`,
                                        style: {
                                          height: `500px`,
                                        },
                                      },
                                      {
                                        default: qt_1(() => [
                                          ...(c[28] ||= [
                                            E_1(` Loading editor... `, -1),
                                          ]),
                                        ]),
                                        _: 1,
                                      },
                                      8,
                                      [`modelValue`, `options`],
                                    ),
                                  ]),
                                  _: 1,
                                }),
                              ]),
                            ]))
                          : (mt_1(),
                            b(
                              `div`,
                              dn,
                              ` No strategy code snapshot available for this session. `,
                            )),
                    ]),
                    _: 1,
                  }),
                ]),
                _: 1,
              },
              8,
              [`open`],
            ),
          ],
          64,
        );
      };
    },
  }),
  [[`__scopeId`, `data-v-7376fc81`]],
);
export { R as default };
