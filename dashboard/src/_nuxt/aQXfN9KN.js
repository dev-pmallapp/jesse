import { r } from "./QTnfLwEv.js";
import { s } from "./DytYwiiF.js";
import {
  $ as $_1,
  D as D_1,
  E as E_1,
  Ft as Ft_1,
  Ht as Ht_1,
  On as On_1,
  Qn,
  Ut as Ut_1,
  _,
  b,
  bt as bt_1,
  ct as ct_1,
  ft as ft_1,
  g as g_1,
  k,
  mt as mt_1,
  nr,
  o as o_1,
  qt as qt_1,
  un as un_1,
  v as v_1,
  vn as vn_1,
  y,
} from "./CoKk4mC0.js";
import { it as it_1, ot as ot_1, q, wt as wt_1 } from "./Cd-sGgPF.js";
import { n as n_1, t as t_1 } from "./2k_QeT3T.js";
import {
  E as E_2,
  O,
  S,
  X as X_1,
  l as l_1,
  r as r_2,
  t as t_2,
  w,
} from "./B8_r5oP7.js";
import { r as r_3 } from "./BpBaBBm3.js";
import { n as n_2, t as t_3 } from "./C96bnRGM.js";
import { t as t_4 } from "./grryJGmv.js";
import { i, r as r_4, t as t_5 } from "./ccMIPn_w.js";
import { t as t_6 } from "./BpJ9fpSU.js";
import { r as r_5 } from "./atteXEGs.js";
import {
  a as a_1,
  c as c_1,
  d,
  f,
  i as i_2,
  l as l_2,
  n as n_3,
  o as o_2,
  p as p_1,
  r as r_6,
  s as s_2,
  t as t_7,
  u,
} from "./C8q3xVCB.js";
import { t as t_8 } from "./Cf85K_3V.js";
import { i as i_3, t as t_9 } from "./CJNUlr67.js";
import { t as t_10 } from "./BG8CfSEZ2.js";
import { t as t_11 } from "./BqJ9I9M42.js";
import { t as t_12 } from "./JgXkd7uo2.js";
import { b as b_2 } from "./1uxVtXhK2.js";
import { t as t_13 } from "./DZsh6Vsl2.js";
import { t as t_14 } from "./B4Wc4BFL2.js";
import { t as t_15 } from "./TtSlr_h_2.js";
import { t as t_16 } from "./DKSmMEZa2.js";
import { t as t_17 } from "./OfUAv67B2.js";
import { t as t_18 } from "./BcJ0KAXG.js";
import { n as n_4, t as t_19 } from "./DY43dlCC.js";
import { t as t_20 } from "./uf1cV9ZP.js";
import { t as t_21 } from "./25FdeeAd.js";
import { t as t_22 } from "./DcUUodPk.js";
import { t as t_23 } from "./B8xNgNWT.js";
import { t as t_24 } from "./Bw1-c76v.js";
import { t as t_25 } from "./BvwLaU7c.js";
import { t as t_26 } from "./BYsxK_gZ.js";
import { t as t_27 } from "./B_-2JulU.js";
import { t as t_28 } from "./mAYmvPyL.js";
import { t as t_29 } from "./BapWjBt9.js";
const Z = {
  class: `flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50/80 p-4 dark:border-gray-700 dark:bg-gray-800/50`,
};
const Q = {
  class: `flex size-9 shrink-0 items-center justify-center rounded-lg bg-white text-indigo-500 shadow-xs ring-1 ring-gray-200 dark:bg-gray-900 dark:text-indigo-400 dark:ring-gray-700`,
};
const Fe = {
  class: `mt-3 flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50/70 px-3.5 py-3 dark:border-emerald-900/70 dark:bg-emerald-950/30`,
};
const Ie = {
  class: `flex items-center justify-end gap-2 pt-1`,
};
const Le = Object.assign(
  k({
    __name: `ReportLiveSession`,
    props: {
      session: {},
    },
    emits: [`close`],
    setup(e, { emit }) {
      let n = emit;
      let i = vn_1(false);
      let a = e;
      let o = vn_1({
        description: ``,
        email: ``,
      });
      let c = () => {
        n(`close`);
      };
      let onSubmit = async () => {
        i.value = true;
        if (!o.value.description) {
          O(`error`, `Please enter a description.`);
          i.value = false;
          return;
        }
        let { data, error } = await S(`/system/report-exception`, {
          method: `POST`,
          body: {
            description: o.value.description,
            email: o.value.email,
            traceback: `manual report`,
            mode: `live`,
            attach_logs: true,
            session_id: a.session,
          },
          authenticated: true,
        });
        i.value = false;
        if (error.value && error.value.statusCode !== 200) {
          O(`error`, `[${error.value.statusCode}]: ${error.value.statusText}`);
          return;
        }
        let data_value = data.value;
        if (data_value.status === `success`) {
          o.value.description = ``;
          o.value.email = ``;
          O(`success`, data_value.message);
          c();
        } else if (data_value.status === `error`) {
          O(`error`, data_value.message);
        }
      };
      return (e, t) => {
        let n = i_3;
        let a = t_3;
        let f = t_10;
        let p = t_1;
        let m = t_9;
        let h = t_15;
        mt_1();
        return b(
          o_1,
          null,
          [
            _(`div`, Z, [
              _(`div`, Q, [
                D_1(n, {
                  name: `i-heroicons-chat-bubble-left-ellipsis`,
                  class: `size-5`,
                }),
              ]),
              (t[3] ||= _(
                `div`,
                null,
                [
                  _(
                    `p`,
                    {
                      class: `text-sm font-semibold text-gray-900 dark:text-white`,
                    },
                    `Tell us what looks wrong`,
                  ),
                  _(
                    `p`,
                    {
                      class: `mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400`,
                    },
                    ` The logs from this live session will be included automatically so we can investigate what happened. `,
                  ),
                ],
                -1,
              )),
            ]),
            _(`div`, Fe, [
              D_1(n, {
                name: `i-heroicons-shield-check`,
                class: `mt-0.5 size-4 shrink-0 text-emerald-500 dark:text-emerald-400`,
              }),
              (t[4] ||= _(
                `div`,
                null,
                [
                  _(
                    `p`,
                    {
                      class: `text-xs font-semibold text-emerald-900 dark:text-emerald-200`,
                    },
                    `Your private data stays private`,
                  ),
                  _(
                    `p`,
                    {
                      class: `mt-0.5 text-xs leading-5 text-emerald-700 dark:text-emerald-300/80`,
                    },
                    ` Exchange API keys and strategy code are never included in the report. `,
                  ),
                ],
                -1,
              )),
            ]),
            D_1(
              h,
              {
                state: On_1(o),
                class: `mt-5 space-y-5`,
                onSubmit,
              },
              {
                default: qt_1(() => [
                  D_1(
                    f,
                    {
                      label: `What seems wrong?`,
                      name: `description`,
                      help: `Tell us what you expected to happen and what happened instead.`,
                      required: ``,
                    },
                    {
                      default: qt_1(() => [
                        D_1(
                          a,
                          {
                            modelValue: On_1(o).description,
                            "onUpdate:modelValue": (t[0] ||= (e) =>
                              (On_1(o).description = e)),
                            rows: 6,
                            placeholder: `Describe the issue with this session...`,
                          },
                          null,
                          8,
                          [`modelValue`],
                        ),
                      ]),
                      _: 1,
                    },
                  ),
                  D_1(
                    f,
                    {
                      label: `Reply email (optional)`,
                      name: `email`,
                      help: `Add an email address only if you'd like us to follow up with you.`,
                    },
                    {
                      default: qt_1(() => [
                        D_1(
                          p,
                          {
                            modelValue: On_1(o).email,
                            "onUpdate:modelValue": (t[1] ||= (e) =>
                              (On_1(o).email = e)),
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
                  ),
                  _(`div`, Ie, [
                    D_1(m, {
                      color: `neutral`,
                      variant: `ghost`,
                      label: `Cancel`,
                      onClick: (t[2] ||= (e) => c()),
                    }),
                    D_1(
                      m,
                      {
                        type: `submit`,
                        icon: `i-heroicons-paper-airplane`,
                        class: `flex min-w-36 justify-center`,
                        label: `Send report`,
                        loading: On_1(i),
                        disabled: On_1(i),
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
          ],
          64,
        );
      };
    },
  }),
  {
    __name: `ReportLiveSession`,
  },
);
const Re = r(E_2(), 1);
const ze = {
  key: 0,
  class: `rounded-xl overflow-hidden border border-gray-200 bg-white shadow-xs p-4 dark:border-gray-700 dark:bg-gray-900`,
};
const Be = {
  key: 0,
};
const Ve = 500;
const He = Object.assign(
  k({
    __name: `CandlesChart`,
    props: {
      form: {},
      results: {},
    },
    setup(e) {
      let t = g_1(() => ot_1().params.id);
      let n = vn_1(true);
      let a = vn_1(null);
      let l = vn_1(false);
      let g = e;
      let x = vn_1();
      let T = vn_1({});
      let D = g_1(() => g.results.selectedRoute);
      let O = g_1(() => D.value?.symbol ?? ``);
      let A = g_1(() => D.value?.timeframe ?? ``);
      let j = g_1(() => `${g.form.exchange}-${O.value}-${A.value}`);
      let M = g_1(() => g.results.candles ?? []);
      let N = g_1(() => g.results.currentCandles);
      let P = g_1(() => g.results.strategyCharts?.[j.value]);
      let F = g_1(() => {
        let e = g.results.positions.find((e) => e[0].value === O.value);
        if (e === undefined) {
          return [];
        }
        return e;
      });
      let L = g_1(() => F.value?.[2]?.value ?? 0);
      let R = g_1(() => {
        let e = Number(F.value?.[1]?.value ?? 0);
        if (e > 0) {
          return `long`;
        }
        if (e < 0) {
          return `short`;
        }
        return `close`;
      });
      ct_1(async () => {
        window.addEventListener(`keydown`, z);
        await B();
      });
      ft_1(() => {
        window.removeEventListener(`keydown`, z);
        H &&= (clearTimeout(H), null);
      });
      function z(e) {
        if (e.key === `Escape` && l.value) {
          l.value = false;
        }
      }
      async function B() {
        n.value = true;
        a.value = null;
        try {
          let e = r_2();
          if ([`ended`, `error`].includes(g.results.phase)) {
            if (!(await e.hydrateSessionChartData(t.value, D.value))) {
              throw Error(
                `The saved candle chart could not be loaded for this session.`,
              );
            }
          } else {
            await Promise.all([
              e.fetchCandles(t.value),
              e.fetchStrategyCharts(t.value),
            ]);
          }
          let r = d(g.results.candles);
          if (r) {
            n.value = false;
            a.value = r;
            console.error(`Candle data validation failed:`, r);
            return;
          }
          n.value = false;
        } catch (e) {
          n.value = false;
          a.value =
            e?.message ||
            `An unexpected error occurred while loading the chart`;
          console.error(`Failed to initialize candle chart:`, e);
        }
      }
      async function onReady() {
        q();
        V();
        await K();
      }
      function te(e) {
        g.results.selectedRoute = e;
        a.value = null;
        B();
      }
      async function ne() {
        a.value = null;
        await B();
      }
      Ht_1(N, (e) => {
        let t = e?.[j.value];
        if (!t) {
          return;
        }
        let n = u(t, -1);
        if (n) {
          console.warn(`Received invalid candle update, skipping:`, n);
          return;
        }
        let r = o_2(t.time);
        r !== null &&
          x.value?.updateCandle({
            ...t,
            time: r,
          });
      });
      Ht_1(
        () => g.results.strategyChartsRev,
        () => {
          re();
        },
      );
      function re() {
        let P_value = P.value;
        if (!(!P_value || !x.value)) {
          for (let t of Object.keys(P_value.lines ?? {})) {
            let n = P_value.lines[t];
            if (n.data.length) {
              x.value.updateLinePoint(t, n.data[n.data.length - 1], n);
            }
          }
          for (let t of Object.keys(P_value.extra_charts ?? {})) {
            for (let n of Object.keys(P_value.extra_charts[t])) {
              let r = P_value.extra_charts[t][n];
              if (r.data.length) {
                x.value.updateExtraLinePoint(
                  t,
                  n,
                  r.data[r.data.length - 1],
                  r,
                );
              }
            }
          }
        }
      }
      Ht_1(
        () => JSON.stringify(P.value?.horizontal_lines ?? {}),
        () => {
          let e = P.value?.horizontal_lines ?? {};
          x.value?.setPriceLines(`strategy`, Object.values(e));
        },
      );
      Ht_1(
        () => JSON.stringify(P.value?.horizontal_extra_lines ?? {}),
        () => {
          x.value?.setExtraHorizontalLines(
            P.value?.horizontal_extra_lines ?? {},
          );
        },
      );
      Ht_1(L, (e, t) => {
        if (e !== t) {
          V();
        }
      });
      Ht_1(
        () => g.results.orders,
        () => {
          V();
          W();
        },
        {
          deep: true,
        },
      );
      function V() {
        let e = [];
        if (Number(L.value) > 0) {
          e.push({
            price: Number(L.value),
            color: R.value === `long` ? `#00AB5C` : `#FF497D`,
            lineWidth: 1,
            lineStyle: 0,
            axisLabelVisible: true,
            title: `Entry Price`,
          });
        }
        g.results.orders.forEach((t) => {
          if (
            (t.status === `ACTIVE` || t.status === `QUEUED`) &&
            t.symbol === O.value
          ) {
            e.push({
              price: Number(t.price),
              color: t.side === `buy` ? `#00AB5C` : `#FF497D`,
              lineWidth: 1,
              lineStyle: 0,
              axisLabelVisible: true,
              title: Re.default.startCase(
                Re.default.lowerCase(`${t.side} ${t.type}`),
              ),
            });
          }
        });
        x.value?.setPriceLines(`orders`, e);
      }
      let H = null;
      function ie() {
        H ||= setTimeout(async () => {
          H = null;
          await G();
        }, 750);
      }
      Ht_1(
        g_1(() => {
          let e = g.results.generalInfo || {};
          return [
            g.results.phase,
            g.form.exchange,
            O.value,
            A.value,
            e.count_trades,
            e.count_active_orders,
          ].join(`|`);
        }),
        () => {
          if ([`running`, `stopping`].includes(g.results.phase)) {
            ie();
          }
        },
      );
      function W() {
        if (!O.value) {
          return;
        }
        let j_value = j.value;
        let t = T.value[j_value] || [];
        let n = new Set(t.map((e) => e.order_id));
        let r = g.results.orders.filter(
          (e) =>
            e.status === `EXECUTED` &&
            e.executed_at &&
            e.symbol === O.value &&
            !n.has(e.id),
        );
        if (r.length > 0) {
          let n = r.map((e) => s_2(e, A.value));
          T.value[j_value] = [...t, ...n];
          q();
        }
      }
      async function G() {
        if (!O.value) {
          return;
        }
        let j_value = j.value;
        try {
          let n = await r_2().fetchOrdersHistory({
            limit: 500,
            offset: 0,
            id_search: t.value,
            status_filter: `EXECUTED`,
            symbol_filter: O.value,
            exchange_filter: g.form.exchange || null,
            date_filter: `90_days`,
            type_filter: null,
            side_filter: null,
          });
          if (n.orders && n.orders.length > 0) {
            let t = n.orders
              .filter((e) => e.executed_at)
              .map((e) => s_2(e, A.value));
            T.value[j_value] = t;
            q();
          }
        } catch (e) {
          console.error(`Failed to refresh executed order markers:`, e);
        }
      }
      async function K() {
        if (O.value) {
          if (T.value[j.value]?.length > 0) {
            q();
            return;
          }
          await G();
        }
      }
      function q() {
        let j_value = j.value;
        let t = a_1(T.value[j_value] || [], Ve);
        T.value[j_value] = t;
        x.value?.setMarkers(t);
      }
      return (e, t) => {
        let o = t_21;
        let p = t_9;
        let m = t_20;
        let h = n_1;
        mt_1();
        return b(`div`, null, [
          On_1(n)
            ? (mt_1(),
              b(`div`, ze, [
                D_1(o, {
                  class: `h-4 w-full mb-4`,
                }),
                D_1(o, {
                  class: `h-4 w-2/3 mb-4`,
                }),
                D_1(o, {
                  class: `h-4 w-1/2 mb-4`,
                }),
                D_1(o, {
                  class: `h-4 w-full mb-4`,
                }),
                D_1(o, {
                  class: `h-4 w-full mb-4`,
                }),
                D_1(o, {
                  class: `h-4 w-2/3 mb-4`,
                }),
                D_1(o, {
                  class: `h-4 w-full mb-4`,
                }),
                D_1(o, {
                  class: `h-4 w-full`,
                }),
              ]))
            : On_1(a)
              ? (mt_1(),
                v_1(
                  m,
                  {
                    key: 1,
                    icon: `i-heroicons-exclamation-triangle`,
                    color: `warning`,
                    variant: `subtle`,
                    title: `Unable to display candle chart`,
                    description: On_1(a),
                  },
                  {
                    actions: qt_1(() => [
                      D_1(
                        p,
                        {
                          color: `neutral`,
                          variant: `outline`,
                          size: `xs`,
                          icon: `i-heroicons-arrow-path`,
                          onClick: ne,
                        },
                        {
                          default: qt_1(() => [
                            ...(t[1] ||= [E_1(` Retry `, -1)]),
                          ]),
                          _: 1,
                        },
                      ),
                    ]),
                    _: 1,
                  },
                  8,
                  [`description`],
                ))
              : On_1(r_6)(On_1(M))
                ? y(``, true)
                : (mt_1(),
                  v_1(m, {
                    key: 2,
                    icon: `i-heroicons-information-circle`,
                    color: `info`,
                    variant: `subtle`,
                    title: `No candle history is available for this route`,
                    description: `This session is saved, but its candle data is no longer available in the local database.`,
                  })),
          !On_1(n) && !On_1(a) && On_1(r_6)(On_1(M))
            ? (mt_1(),
              b(
                `div`,
                {
                  key: 3,
                  class: Qn(
                    On_1(l)
                      ? `fixed inset-0 z-50 p-4 bg-white dark:bg-gray-900 flex flex-col`
                      : ``,
                  ),
                },
                [
                  _(
                    `div`,
                    {
                      class: Qn([
                        `rounded-xl overflow-hidden border border-gray-200 bg-white shadow-xs dark:border-gray-700 dark:bg-gray-900`,
                        On_1(l) ? `flex-1 min-h-0` : `h-[480px]`,
                      ]),
                    },
                    [
                      D_1(
                        n_3,
                        {
                          ref_key: `chart`,
                          ref: x,
                          class: `!border-0`,
                          candles: On_1(M),
                          watermark: `${On_1(O)} • ${On_1(A)}`,
                          "pane-state-key": On_1(D)?.strategy ?? `live`,
                          lines: On_1(P)?.lines,
                          "extra-charts": On_1(P)?.extra_charts,
                          "horizontal-lines": On_1(P)?.horizontal_lines,
                          "horizontal-extra-lines":
                            On_1(P)?.horizontal_extra_lines,
                          markers: On_1(T)[On_1(j)],
                          onReady,
                        },
                        {
                          toolbar: qt_1(() => [
                            D_1(
                              h,
                              {
                                text: On_1(l)
                                  ? `Exit fullscreen`
                                  : `Fullscreen`,
                                arrow: ``,
                              },
                              {
                                default: qt_1(() => [
                                  D_1(
                                    p,
                                    {
                                      icon: On_1(l)
                                        ? `i-heroicons-arrows-pointing-in`
                                        : `i-heroicons-arrows-pointing-out`,
                                      color: `neutral`,
                                      variant: `ghost`,
                                      size: `xs`,
                                      onClick: (t[0] ||= (e) =>
                                        (l.value = !On_1(l))),
                                    },
                                    null,
                                    8,
                                    [`icon`],
                                  ),
                                ]),
                                _: 1,
                              },
                              8,
                              [`text`],
                            ),
                          ]),
                          _: 1,
                        },
                        8,
                        [
                          `candles`,
                          `watermark`,
                          `pane-state-key`,
                          `lines`,
                          `extra-charts`,
                          `horizontal-lines`,
                          `horizontal-extra-lines`,
                          `markers`,
                        ],
                      ),
                    ],
                    2,
                  ),
                  g.form.routes.length > 1 && !On_1(l)
                    ? (mt_1(),
                      b(`div`, Be, [
                        (mt_1(true),
                        b(
                          o_1,
                          null,
                          bt_1(g.form.routes, (e) => {
                            mt_1();
                            return v_1(
                              p,
                              {
                                key: e.symbol,
                                variant: `soft`,
                                color: `neutral`,
                                disabled:
                                  On_1(D)?.symbol === e.symbol &&
                                  On_1(D)?.timeframe === e.timeframe,
                                class: `mt-2 mr-2`,
                                onClick: (t) => te(e),
                              },
                              {
                                default: qt_1(() => [
                                  E_1(
                                    nr(e.symbol) + ` • ` + nr(e.timeframe),
                                    1,
                                  ),
                                ]),
                                _: 2,
                              },
                              1032,
                              [`disabled`, `onClick`],
                            );
                          }),
                          128,
                        )),
                      ]))
                    : y(``, true),
                ],
                2,
              ))
            : y(``, true),
        ]);
      };
    },
  }),
  {
    __name: `CandlesChart`,
  },
);
const Ue = {
  class: `flex justify-end mb-4`,
};
const We = Object.assign(
  k({
    __name: `LiveClosedTrades`,
    props: {
      trades: {},
      sessionId: {},
    },
    emits: [`trade-click`, `reload`],
    setup(e, { emit }) {
      let n = e;
      let i = emit;
      let a = vn_1(false);
      let o = g_1(() => {
        if (!n.trades.length) {
          return [];
        }
        let e = [];
        for (let t of n.trades) {
          e.push([
            {
              value: t.symbol,
              style: `text-xs`,
            },
            {
              value: t.type,
              style: w.colorBasedOnType(t.type),
            },
            {
              value: w.roundPrice(t.entry_price),
              style: `text-xs`,
            },
            {
              value: t.exit_price ? w.roundPrice(t.exit_price) : `-`,
              style: `text-xs`,
            },
            {
              value: t.qty,
              style: `text-xs`,
            },
            {
              value:
                t.pnl === null
                  ? `-`
                  : `${Re.default.round(t.pnl, 2)} (${Re.default.round(t.pnl_percentage, 2)}%)`,
              style: t.pnl === null ? `` : w.colorBasedOnNumber(t.pnl),
            },
            {
              value: w.timestampToTimeOnly(t.opened_at),
              style: `text-xs`,
              tooltip: w.timestampToTime(t.opened_at),
            },
            {
              value: t.status,
              style:
                t.status === `open`
                  ? `text-blue-600 dark:text-blue-400`
                  : `text-gray-600 dark:text-gray-400`,
            },
          ]);
        }
        return e;
      });
      function c(e) {
        if (e >= 0 && e < n.trades.length) {
          let t = n.trades[e];
          i(`trade-click`, t.id);
        }
      }
      async function l() {
        a.value = true;
        i(`reload`);
        setTimeout(() => {
          a.value = false;
        }, 1000);
      }
      return (e, t) => {
        let n = t_9;
        let i = t_25;
        let f = t_16;
        mt_1();
        return b(`div`, null, [
          _(`div`, Ue, [
            D_1(
              n,
              {
                icon: `i-heroicons-arrow-path`,
                size: `xs`,
                variant: `soft`,
                color: `neutral`,
                loading: On_1(a),
                label: `Reload Trades`,
                class: `font-bold uppercase tracking-wider text-[10px]`,
                onClick: l,
              },
              null,
              8,
              [`loading`],
            ),
          ]),
          On_1(o).length
            ? (mt_1(),
              v_1(
                i,
                {
                  key: 0,
                  data: On_1(o),
                  "header-items": [
                    `Symbol`,
                    `Type`,
                    `Entry`,
                    `Exit`,
                    `QTY`,
                    `PNL`,
                    `Opened`,
                    `Status`,
                  ],
                  header: ``,
                  clickable: true,
                  scrollable: ``,
                  "scroll-label": `Live trades`,
                  onRowClick: c,
                },
                null,
                8,
                [`data`],
              ))
            : (mt_1(),
              v_1(f, {
                key: 1,
                class: `mt-4`,
              })),
        ]);
      };
    },
  }),
  {
    __name: `LiveClosedTrades`,
  },
);
const Ge = Object.assign(
  k({
    __name: `LiveOrders`,
    props: {
      orders: {},
    },
    emits: [`order-click`],
    setup(e, { emit }) {
      let n = e;
      let r = emit;
      let i = g_1(() => {
        if (!n.orders.length) {
          return [];
        }
        let e = [];
        for (let t = n.orders.length - 1; t >= 0; t--) {
          let r = n.orders[t];
          e.push([
            {
              value: w.timestampToTimeOnly(r.created_at),
              style: `text-xs`,
              tooltip: w.timestampToTime(r.created_at),
            },
            {
              value: r.symbol,
              style: `text-xs`,
            },
            {
              value: r.type,
              style: `text-xs`,
            },
            {
              value: r.side,
              style: w.colorBasedOnSide(r.side),
            },
            {
              value: w.formatNumber(r.price),
              style: `text-xs`,
            },
            {
              value: w.formatNumber(r.qty),
              style: w.colorBasedOnSide(r.side),
            },
            {
              value: r.status,
              style: `text-xs`,
            },
          ]);
        }
        return e;
      });
      function a(e) {
        let t = n.orders.length - 1 - e;
        if (t >= 0 && t < n.orders.length) {
          let e = n.orders[t];
          r(`order-click`, e.id);
        }
      }
      return (e, t) => {
        let n = t_25;
        let r = t_16;
        if (On_1(i).length) {
          return (
            mt_1(),
            v_1(
              n,
              {
                key: 0,
                data: On_1(i),
                "header-items": [
                  `Created`,
                  `Symbol`,
                  `Type`,
                  `Side`,
                  `Price`,
                  `QTY`,
                  `Status`,
                ],
                header: ``,
                clickable: true,
                scrollable: ``,
                "scroll-label": `Live orders`,
                onRowClick: a,
              },
              null,
              8,
              [`data`],
            )
          );
        }
        return (
          mt_1(),
          v_1(r, {
            key: 1,
          })
        );
      };
    },
  }),
  {
    __name: `LiveOrders`,
  },
);
const Ke = {
  class: `flex items-center gap-2.5`,
};
const qe = {
  class: `hidden sm:flex size-9 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-700/70 dark:text-indigo-300`,
};
const Je = {
  key: 0,
  class: `flex h-full gap-3 rounded-2xl border border-gray-200 bg-gray-100/70 p-2 overflow-hidden dark:border-gray-700 dark:bg-gray-950/50`,
};
const Ye = {
  class: `w-80 shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs dark:border-gray-700 dark:bg-gray-900`,
};
const Xe = {
  class: `px-4 pt-4 pb-3`,
};
const Ze = {
  class: `flex items-center gap-3`,
};
const Qe = {
  class: `space-y-2`,
};
const $e = {
  class: `mt-4 grid grid-cols-3 gap-2`,
};
const et = {
  class: `space-y-1 px-3`,
};
const tt = {
  class: `flex-1 space-y-1.5`,
};
const nt = {
  class: `flex-1 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs p-4 dark:border-gray-700 dark:bg-gray-900`,
};
const rt = Object.assign(
  k({
    __name: `TradeHistoryChartModal`,
    props: $_1(
      {
        sessionId: {},
        form: {},
        refreshKey: {},
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
      let t = Ft_1(e, `modelValue`);
      let n = e;
      let c = r_2();
      let l = {
        symbol: ``,
        timeframe: `1m`,
        strategy: ``,
      };
      let p = vn_1(n.form.routes[0] ? c_1(n.form.routes[0]) : ``);
      let m = g_1(
        () =>
          n.form.routes.find((e) => c_1(e) === p.value) ??
          n.form.routes[0] ??
          l,
      );
      let g = vn_1(true);
      let v = vn_1(false);
      let T = vn_1(null);
      let E = vn_1(null);
      let D = g_1(() =>
        n.form.routes.map((e) => ({
          label: `${e.strategy} • ${e.symbol} • ${e.timeframe}`,
          value: c_1(e),
        })),
      );
      let O = g_1(() => E.value?.trades.map(i_2) ?? []);
      let A = g_1(
        () => E.value?.orders.map((e) => s_2(e, m.value.timeframe)) ?? [],
      );
      Ht_1(t, async (e) => {
        if (e) {
          if (!n.form.routes.some((e) => c_1(e) === p.value)) {
            p.value = n.form.routes[0] ? c_1(n.form.routes[0]) : ``;
          }
          await j();
        }
      });
      Ht_1(p, async (e, n) => {
        if (!(!t.value || !e || e === n)) {
          await j();
        }
      });
      Ht_1(
        () => n.form.routes,
        (e) => {
          e.length &&
            (e.some((e) => c_1(e) === p.value) || (p.value = c_1(e[0])));
        },
        {
          deep: true,
        },
      );
      Ht_1(
        () => n.refreshKey,
        async () => {
          if (t.value && !v.value) {
            await j();
          }
        },
      );
      async function j() {
        if (m.value?.symbol) {
          v.value = true;
          T.value = null;
          try {
            let e = await c.fetchSessionChartData(
              n.sessionId,
              m.value,
              null,
              1000,
              true,
            );
            if (!e) {
              T.value = `The session chart data could not be loaded.`;
              return;
            }
            E.value = e;
          } catch (e) {
            T.value =
              e?.message ||
              `An unexpected error occurred while loading the chart.`;
          } finally {
            v.value = false;
          }
        }
      }
      return (e, n) => {
        let a = i_3;
        let o = t_8;
        let c = t_9;
        let l = n_1;
        let h = t_21;
        let C = t_20;
        let M = f;
        mt_1();
        return v_1(
          M,
          {
            modelValue: t.value,
            "onUpdate:modelValue": (n[5] ||= (e) => (t.value = e)),
          },
          {
            title: qt_1(() => [
              _(`div`, Ke, [
                _(`div`, qe, [
                  D_1(a, {
                    name: `i-heroicons-chart-bar-square`,
                    class: `size-5`,
                  }),
                ]),
                (n[6] ||= _(
                  `div`,
                  {
                    class: `hidden lg:block mr-1`,
                  },
                  [
                    _(
                      `div`,
                      {
                        class: `text-sm font-semibold text-gray-900 dark:text-white`,
                      },
                      `Trade chart`,
                    ),
                    _(
                      `div`,
                      {
                        class: `text-[11px] text-gray-400 dark:text-gray-500`,
                      },
                      `Price action and executions`,
                    ),
                  ],
                  -1,
                )),
                On_1(D).length > 1
                  ? (mt_1(),
                    v_1(
                      o,
                      {
                        key: 0,
                        modelValue: On_1(p),
                        "onUpdate:modelValue": (n[0] ||= (e) => {
                          if (un_1(p)) {
                            return (p.value = e);
                          }
                          return null;
                        }),
                        class: `min-w-56`,
                        "value-key": `value`,
                        items: On_1(D),
                        "search-input": false,
                      },
                      null,
                      8,
                      [`modelValue`, `items`],
                    ))
                  : y(``, true),
                D_1(
                  c,
                  {
                    color: `neutral`,
                    variant: `soft`,
                    icon: `i-heroicons-rectangle-group`,
                    label: On_1(g) ? `Hide activity` : `Show activity`,
                    onClick: (n[1] ||= (e) => (g.value = !On_1(g))),
                  },
                  null,
                  8,
                  [`label`],
                ),
                D_1(
                  l,
                  {
                    text: `Refresh`,
                    arrow: ``,
                  },
                  {
                    default: qt_1(() => [
                      D_1(
                        c,
                        {
                          color: `neutral`,
                          variant: `ghost`,
                          icon: `i-heroicons-arrow-path`,
                          loading: On_1(v),
                          onClick: (n[2] ||= (e) => j()),
                        },
                        null,
                        8,
                        [`loading`],
                      ),
                    ]),
                    _: 1,
                  },
                ),
              ]),
            ]),
            default: qt_1(() => [
              On_1(v)
                ? (mt_1(),
                  b(`div`, Je, [
                    _(`div`, Ye, [
                      _(`div`, Xe, [
                        _(`div`, Ze, [
                          D_1(h, {
                            class: `size-9 rounded-xl`,
                          }),
                          _(`div`, Qe, [
                            D_1(h, {
                              class: `h-3.5 w-24`,
                            }),
                            D_1(h, {
                              class: `h-2.5 w-16`,
                            }),
                          ]),
                        ]),
                        _(`div`, $e, [
                          (mt_1(),
                          b(
                            o_1,
                            null,
                            bt_1(3, (e) =>
                              D_1(h, {
                                key: e,
                                class: `h-14 rounded-lg`,
                              }),
                            ),
                            64,
                          )),
                        ]),
                      ]),
                      _(`div`, et, [
                        (mt_1(),
                        b(
                          o_1,
                          null,
                          bt_1(9, (e) =>
                            _(
                              `div`,
                              {
                                key: e,
                                class: `flex items-center gap-3 rounded-lg px-2 py-2.5`,
                              },
                              [
                                D_1(h, {
                                  class: `size-4 rounded-sm`,
                                }),
                                _(`div`, tt, [
                                  D_1(h, {
                                    class: `h-3 w-full max-w-44`,
                                  }),
                                  D_1(h, {
                                    class: `h-2 w-28`,
                                  }),
                                ]),
                                D_1(h, {
                                  class: `h-6 w-12 rounded-md`,
                                }),
                              ],
                            ),
                          ),
                          64,
                        )),
                      ]),
                    ]),
                    _(`div`, nt, [
                      D_1(h, {
                        class: `h-full w-full rounded-lg`,
                      }),
                    ]),
                  ]))
                : On_1(T)
                  ? (mt_1(),
                    v_1(
                      C,
                      {
                        key: 1,
                        icon: `i-heroicons-exclamation-triangle`,
                        color: `warning`,
                        variant: `subtle`,
                        title: `Unable to display trade chart`,
                        description: On_1(T),
                      },
                      {
                        actions: qt_1(() => [
                          D_1(
                            c,
                            {
                              color: `neutral`,
                              variant: `outline`,
                              size: `xs`,
                              icon: `i-heroicons-arrow-path`,
                              onClick: (n[3] ||= (e) => j()),
                            },
                            {
                              default: qt_1(() => [
                                ...(n[7] ||= [E_1(` Retry `, -1)]),
                              ]),
                              _: 1,
                            },
                          ),
                        ]),
                        _: 1,
                      },
                      8,
                      [`description`],
                    ))
                  : On_1(E) && On_1(E).candles.length === 0
                    ? (mt_1(),
                      v_1(C, {
                        key: 2,
                        icon: `i-heroicons-information-circle`,
                        color: `info`,
                        variant: `subtle`,
                        title: `No candle history is available for this route`,
                        description: `The session's trades and orders are stored, but its candle data is not available in the local database.`,
                      }))
                    : On_1(E)
                      ? (mt_1(),
                        v_1(
                          t_7,
                          {
                            key: 3,
                            modelValue: On_1(g),
                            "onUpdate:modelValue": (n[4] ||= (e) => {
                              if (un_1(g)) {
                                return (g.value = e);
                              }
                              return null;
                            }),
                            candles: On_1(E).candles,
                            trades: On_1(O),
                            markers: On_1(A),
                            watermark: `${On_1(m).symbol} • ${On_1(m).timeframe}`,
                            timeframe: On_1(m).timeframe,
                            "pane-state-key": On_1(m).strategy,
                            lines: On_1(E).strategy_charts?.lines,
                            "extra-charts":
                              On_1(E).strategy_charts?.extra_charts,
                            "horizontal-lines":
                              On_1(E).strategy_charts?.horizontal_lines,
                            "horizontal-extra-lines":
                              On_1(E).strategy_charts?.horizontal_extra_lines,
                          },
                          null,
                          8,
                          [
                            `modelValue`,
                            `candles`,
                            `trades`,
                            `markers`,
                            `watermark`,
                            `timeframe`,
                            `pane-state-key`,
                            `lines`,
                            `extra-charts`,
                            `horizontal-lines`,
                            `horizontal-extra-lines`,
                          ],
                        ))
                      : y(``, true),
            ]),
            _: 1,
          },
          8,
          [`modelValue`],
        );
      };
    },
  }),
  {
    __name: `LiveTradeHistoryChartModal`,
  },
);
const it = {
  class: `divide-y divide-gray-100 dark:divide-gray-800`,
};
const at = {
  class: `grid grid-cols-1 gap-2`,
};
const ot = {
  class: `grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3`,
};
const st = {
  key: 0,
  class: `mt-4 space-y-4 border-t border-gray-100 pt-4 dark:border-gray-800`,
};
const ct = {
  class: `grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3`,
};
const lt = Object.assign(
  k({
    __name: `LiveSettings`,
    props: {
      config: {},
      exchange: {},
      paperMode: {
        type: Boolean,
      },
    },
    setup(e) {
      let options = [
        `1m`,
        `3m`,
        `5m`,
        `15m`,
        `30m`,
        `45m`,
        `1h`,
        `2h`,
        `3h`,
        `4h`,
        `6h`,
        `8h`,
        `12h`,
        `1D`,
      ];
      return (n, i) => {
        let a = t_11;
        let o = t_12;
        let s = t_1;
        let c = b_2;
        let l = t_13;
        let f = t_5;
        mt_1();
        return b(`div`, it, [
          D_1(
            o,
            {
              title: `Session behavior`,
              flat: ``,
            },
            {
              default: qt_1(() => [
                _(`div`, at, [
                  D_1(
                    a,
                    {
                      modelValue: e.config.persistency,
                      "onUpdate:modelValue": (i[0] ||= (t) =>
                        (e.config.persistency = t)),
                      compact: ``,
                      title: `Enable Persistency`,
                      description: `Continue from existing exchange positions and orders when this session starts.`,
                    },
                    null,
                    8,
                    [`modelValue`],
                  ),
                  D_1(
                    a,
                    {
                      modelValue: e.config.generate_candles_from_1m,
                      "onUpdate:modelValue": (i[1] ||= (t) =>
                        (e.config.generate_candles_from_1m = t)),
                      compact: ``,
                      title: `Generate Candles Locally`,
                      description: `Build larger timeframes locally from live 1m candles. When disabled, Jesse requests each configured timeframe directly from the exchange, which is not supported by every exchange.`,
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
          D_1(
            o,
            {
              title: `Logs`,
              flat: ``,
            },
            {
              default: qt_1(() => [
                _(`div`, ot, [
                  D_1(
                    a,
                    {
                      modelValue: e.config.logging.strategy_execution,
                      "onUpdate:modelValue": (i[2] ||= (t) =>
                        (e.config.logging.strategy_execution = t)),
                      compact: ``,
                      title: `Strategy Execution`,
                    },
                    null,
                    8,
                    [`modelValue`],
                  ),
                  D_1(
                    a,
                    {
                      modelValue: e.config.logging.order_submission,
                      "onUpdate:modelValue": (i[3] ||= (t) =>
                        (e.config.logging.order_submission = t)),
                      compact: ``,
                      title: `Order Submission`,
                    },
                    null,
                    8,
                    [`modelValue`],
                  ),
                  D_1(
                    a,
                    {
                      modelValue: e.config.logging.order_cancellation,
                      "onUpdate:modelValue": (i[4] ||= (t) =>
                        (e.config.logging.order_cancellation = t)),
                      compact: ``,
                      title: `Order Cancellation`,
                    },
                    null,
                    8,
                    [`modelValue`],
                  ),
                  D_1(
                    a,
                    {
                      modelValue: e.config.logging.order_execution,
                      "onUpdate:modelValue": (i[5] ||= (t) =>
                        (e.config.logging.order_execution = t)),
                      compact: ``,
                      title: `Order Execution`,
                    },
                    null,
                    8,
                    [`modelValue`],
                  ),
                  D_1(
                    a,
                    {
                      modelValue: e.config.logging.position_opened,
                      "onUpdate:modelValue": (i[6] ||= (t) =>
                        (e.config.logging.position_opened = t)),
                      compact: ``,
                      title: `Position Opened`,
                    },
                    null,
                    8,
                    [`modelValue`],
                  ),
                  D_1(
                    a,
                    {
                      modelValue: e.config.logging.position_increased,
                      "onUpdate:modelValue": (i[7] ||= (t) =>
                        (e.config.logging.position_increased = t)),
                      compact: ``,
                      title: `Position Increased`,
                    },
                    null,
                    8,
                    [`modelValue`],
                  ),
                  D_1(
                    a,
                    {
                      modelValue: e.config.logging.position_reduced,
                      "onUpdate:modelValue": (i[8] ||= (t) =>
                        (e.config.logging.position_reduced = t)),
                      compact: ``,
                      title: `Position Reduced`,
                    },
                    null,
                    8,
                    [`modelValue`],
                  ),
                  D_1(
                    a,
                    {
                      modelValue: e.config.logging.position_closed,
                      "onUpdate:modelValue": (i[9] ||= (t) =>
                        (e.config.logging.position_closed = t)),
                      compact: ``,
                      title: `Position Closed`,
                    },
                    null,
                    8,
                    [`modelValue`],
                  ),
                  D_1(
                    a,
                    {
                      modelValue: e.config.logging.exchange_ws_reconnection,
                      "onUpdate:modelValue": (i[10] ||= (t) =>
                        (e.config.logging.exchange_ws_reconnection = t)),
                      compact: ``,
                      title: `WebSocket Reconnection`,
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
          D_1(
            o,
            {
              title: `Data`,
              flat: ``,
            },
            {
              default: qt_1(() => [
                D_1(
                  c,
                  {
                    title: `Warmup Candles`,
                    description: `Number of candles loaded before this live session starts.`,
                  },
                  {
                    default: qt_1(() => [
                      D_1(
                        s,
                        {
                          modelValue: e.config.warm_up_candles,
                          "onUpdate:modelValue": (i[11] ||= (t) =>
                            (e.config.warm_up_candles = t)),
                          class: `w-full`,
                          type: `number`,
                          min: `1`,
                          placeholder: `e.g. 210`,
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
            },
          ),
          D_1(
            o,
            {
              title: `Notifications`,
              flat: ``,
            },
            {
              default: qt_1(() => [
                D_1(
                  a,
                  {
                    modelValue: e.config.notifications.enabled,
                    "onUpdate:modelValue": (i[12] ||= (t) =>
                      (e.config.notifications.enabled = t)),
                    compact: ``,
                    title: `Enable Notifications`,
                    description: `Send selected live-trading events through this session's notification driver.`,
                  },
                  null,
                  8,
                  [`modelValue`],
                ),
                e.config.notifications.enabled
                  ? (mt_1(),
                    b(`div`, st, [
                      _(`div`, ct, [
                        D_1(
                          a,
                          {
                            modelValue: e.config.notifications.events.errors,
                            "onUpdate:modelValue": (i[13] ||= (t) =>
                              (e.config.notifications.events.errors = t)),
                            compact: ``,
                            title: `Errors`,
                          },
                          null,
                          8,
                          [`modelValue`],
                        ),
                        D_1(
                          a,
                          {
                            modelValue:
                              e.config.notifications.events.started_session,
                            "onUpdate:modelValue": (i[14] ||= (t) =>
                              (e.config.notifications.events.started_session =
                                t)),
                            compact: ``,
                            title: `Session Start`,
                          },
                          null,
                          8,
                          [`modelValue`],
                        ),
                        D_1(
                          a,
                          {
                            modelValue:
                              e.config.notifications.events.terminated_session,
                            "onUpdate:modelValue": (i[15] ||= (t) =>
                              (e.config.notifications.events.terminated_session =
                                t)),
                            compact: ``,
                            title: `Session Termination`,
                          },
                          null,
                          8,
                          [`modelValue`],
                        ),
                        D_1(
                          a,
                          {
                            modelValue:
                              e.config.notifications.events.submitted_orders,
                            "onUpdate:modelValue": (i[16] ||= (t) =>
                              (e.config.notifications.events.submitted_orders =
                                t)),
                            compact: ``,
                            title: `Order Submission`,
                          },
                          null,
                          8,
                          [`modelValue`],
                        ),
                        D_1(
                          a,
                          {
                            modelValue:
                              e.config.notifications.events.cancelled_orders,
                            "onUpdate:modelValue": (i[17] ||= (t) =>
                              (e.config.notifications.events.cancelled_orders =
                                t)),
                            compact: ``,
                            title: `Order Cancellation`,
                          },
                          null,
                          8,
                          [`modelValue`],
                        ),
                        D_1(
                          a,
                          {
                            modelValue:
                              e.config.notifications.events.executed_orders,
                            "onUpdate:modelValue": (i[18] ||= (t) =>
                              (e.config.notifications.events.executed_orders =
                                t)),
                            compact: ``,
                            title: `Order Execution`,
                          },
                          null,
                          8,
                          [`modelValue`],
                        ),
                        D_1(
                          a,
                          {
                            modelValue:
                              e.config.notifications.events.opened_position,
                            "onUpdate:modelValue": (i[19] ||= (t) =>
                              (e.config.notifications.events.opened_position =
                                t)),
                            compact: ``,
                            title: `Opened Positions`,
                          },
                          null,
                          8,
                          [`modelValue`],
                        ),
                        D_1(
                          a,
                          {
                            modelValue:
                              e.config.notifications.events.updated_position,
                            "onUpdate:modelValue": (i[20] ||= (t) =>
                              (e.config.notifications.events.updated_position =
                                t)),
                            compact: ``,
                            title: `Updated Position`,
                          },
                          null,
                          8,
                          [`modelValue`],
                        ),
                      ]),
                      D_1(
                        l,
                        {
                          modelValue:
                            e.config.notifications.position_report_timeframe,
                          "onUpdate:modelValue": (i[21] ||= (t) =>
                            (e.config.notifications.position_report_timeframe =
                              t)),
                          title: `Report Frequency`,
                          description: `How often recurring position reports are sent.`,
                          options,
                        },
                        null,
                        8,
                        [`modelValue`],
                      ),
                    ]))
                  : y(``, true),
              ]),
              _: 1,
            },
          ),
          D_1(
            f,
            {
              modelValue: e.config.exchange,
              "onUpdate:modelValue": (i[22] ||= (t) => (e.config.exchange = t)),
              "exchange-name": e.exchange,
              "simulation-values": e.paperMode,
              flat: ``,
            },
            null,
            8,
            [`modelValue`, `exchange-name`, `simulation-values`],
          ),
        ]);
      };
    },
  }),
  {
    __name: `SettingsLiveSettings`,
  },
);
const value = `__no_notification__`;
function dt(e) {
  return [
    {
      label: `No notifications`,
      value,
    },
    ...e.map((e) => ({
      label: `${e.name} - ${e.driver}`,
      value: e.id,
    })),
  ];
}
function $(e) {
  return e || `__no_notification__`;
}
function ft(e) {
  if (e === `__no_notification__`) {
    return ``;
  }
  return e;
}
const pt = [`aria-label`];
const mt = [`aria-label`];
const ht = {
  key: 0,
  class: `flex flex-col items-center justify-center mt-[6%]`,
};
const gt = {
  class: `mt-8`,
};
const _t = {
  key: 0,
  class: `mx-auto container mt-8`,
};
const vt = {
  key: 1,
  class: `flex-1 flex flex-col p-3`,
};
const yt = {
  class: `flex-1 rounded-2xl border border-gray-200 bg-gray-100/70 dark:border-gray-800 dark:bg-gray-950`,
};
const bt = {
  key: 0,
  class: `space-y-3`,
  "data-cy": `live-page-content`,
};
const xt = {
  class: `flex justify-between items-center`,
};
const St = {
  class: `grid grid-cols-1 gap-2 lg:grid-cols-2`,
};
const Ct = {
  class: `flex justify-between items-center`,
};
const wt = {
  key: 1,
};
const Tt = {
  key: 0,
  class: `mb-8`,
};
const Et = {
  class: `space-y-3`,
};
const Dt = {
  key: 1,
  class: `overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs dark:border-gray-700 dark:bg-gray-900`,
};
const Ot = {
  class: `flex items-center justify-between gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-700`,
};
const kt = {
  class: `flex shrink-0 items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1 dark:border-gray-700 dark:bg-gray-800/70`,
};
const At = [`onClick`];
const jt = {
  class: `p-3`,
};
const Mt = {
  key: 0,
  class: `flex flex-col items-center justify-center gap-2 py-10 text-center`,
};
const Nt = {
  class: `overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs dark:border-gray-700 dark:bg-gray-900`,
};
const Pt = {
  class: `flex items-center gap-1 border-b border-gray-200 bg-gray-50/70 p-1.5 dark:border-gray-700 dark:bg-gray-800/40`,
};
const Ft = [`onClick`];
const It = {
  key: 0,
  class: `w-2 h-2 rounded-full shrink-0 bg-green-500`,
};
const Lt = {
  class: `truncate`,
};
const Rt = {
  class: `p-3`,
};
const zt = {
  key: 0,
  class: `overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs dark:border-gray-700 dark:bg-gray-900`,
};
const Bt = {
  class: `flex items-center justify-between gap-3 border-b border-gray-200 px-4 py-2.5 dark:border-gray-700`,
};
const Vt = {
  class: `flex min-w-0 items-center gap-2.5`,
};
const Ht = {
  class: `relative flex size-2 shrink-0`,
};
const Ut = {
  class: `truncate text-sm font-semibold text-gray-900 dark:text-white`,
};
const Wt = {
  key: 0,
  class: `shrink-0 text-xs text-gray-400 dark:text-gray-500`,
};
const Gt = {
  class: `divide-y divide-gray-100 dark:divide-gray-800`,
};
const Kt = {
  key: 0,
  class: `shrink-0 text-xs tabular-nums text-gray-400 dark:text-gray-500`,
};
const qt = {
  key: 0,
  class: `shrink-0 rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold leading-none text-white`,
};
const Jt = {
  key: 1,
  "data-cy": `live-action-button`,
};
const Yt = {
  class: `px-4 py-3.5 space-y-3`,
};
const Xt = {
  class: `flex items-center justify-between text-sm`,
};
const Zt = {
  class: `ml-4 truncate font-semibold text-gray-900 dark:text-gray-100`,
};
const Qt = {
  class: `flex items-center justify-between text-sm`,
};
const $t = {
  class: `ml-4 truncate font-semibold text-gray-900 dark:text-gray-100`,
};
const en = {
  class: `flex items-center justify-between text-sm`,
};
const tn = {
  class: `ml-4 truncate font-semibold text-gray-900 dark:text-gray-100`,
};
const nn = {
  class: `text-sm`,
};
const rn = {
  class: `mt-2 flex flex-wrap gap-1.5`,
};
const an = {
  key: 0,
  class: `rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-[11px] font-medium text-indigo-600 dark:border-indigo-500/40 dark:bg-indigo-500/10 dark:text-indigo-300`,
};
const on = {
  key: 1,
  class: `rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-[11px] font-medium text-indigo-600 dark:border-indigo-500/40 dark:bg-indigo-500/10 dark:text-indigo-300`,
};
const sn = {
  key: 2,
  class: `text-xs text-gray-400 dark:text-gray-500`,
};
const cn = {
  key: 2,
  class: `mt-3 space-y-3`,
};
const ln = {
  class: `overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs dark:border-gray-700 dark:bg-gray-900`,
};
const un = {
  class: `border-b border-gray-200 px-4 pt-4 pb-3 dark:border-gray-700`,
};
const dn = {
  class: `text-xs text-gray-400 dark:text-gray-500`,
};
const fn = {
  class: `mt-3 grid grid-cols-3 gap-2`,
};
const pn = {
  class: `text-[10px] uppercase tracking-wide text-gray-400`,
};
const mn = [`title`];
const hn = {
  class: `px-4 py-3.5 space-y-3`,
};
const gn = {
  class: `text-sm font-medium text-gray-500 dark:text-gray-400`,
};
const _n = {
  class: `ml-4 truncate text-sm font-semibold text-gray-900 dark:text-gray-100`,
};
const vn = {
  class: `px-4 py-3.5 space-y-3`,
};
const yn = {
  class: `text-sm font-medium text-gray-500 dark:text-gray-400 shrink-0`,
};
const bn = {
  class: `text-sm font-semibold text-gray-900 dark:text-gray-100 sm:text-right whitespace-pre-wrap overflow-x-auto max-w-full`,
};
const xn = {
  class: `px-4 py-3.5 space-y-3`,
};
const Sn = {
  class: `text-sm font-bold text-gray-900 dark:text-gray-100 truncate pr-2`,
};
const Cn = {
  class: `text-sm text-gray-500 dark:text-gray-400 truncate text-center px-2`,
};
const wn = {
  class: `flex justify-end ml-auto`,
};
const Tn = {
  class: `px-4 py-3.5`,
};
const En = {
  key: 0,
  class: `text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap`,
};
const Dn = {
  key: 1,
  class: `text-sm text-gray-400 dark:text-gray-500 italic text-center py-2`,
};
const On = Object.assign(
  k({
    __name: `LiveTab`,
    props: {
      form: {},
      results: {},
      session: {},
      tabs: {},
    },
    setup(e) {
      let n = e;
      let a = l_1();
      r_3({
        title: g_1(() => {
          if (n.results.generalInfo.title) {
            return `${n.results.generalInfo.title} - Live Session - Jesse`;
          }
          return `Live Session - Jesse`;
        }),
      });
      let l = vn_1([]);
      let m = vn_1(false);
      let g = vn_1(false);
      let T = vn_1(false);
      let E = vn_1(false);
      let D = vn_1(false);
      let k = vn_1(false);
      let A = vn_1(false);
      let j = vn_1(false);
      let N = vn_1(false);
      let B = vn_1(false);
      let ee = vn_1(null);
      let V = vn_1(null);
      let H = vn_1(`positions`);
      let U = vn_1(false);
      let W = vn_1(false);
      let ae = vn_1(null);
      let G = vn_1(null);
      let K = vn_1(`auto`);
      let J = t_2();
      let Y = r_2();
      let J_authToken = J.authToken;
      let X = vn_1(s().public.apiBaseUrl);
      let ce = g_1(() => Y.configApplyTargetIds(n.session).length);
      async function onBulkApply() {
        let e = await Y.applyConfigToCompatibleTabs(n.session);
        if (e > 0) {
          O(
            `success`,
            `Advanced settings applied to ${e} ${e === 1 ? `tab` : `tabs`}`,
          );
        }
      }
      let pe = g_1(() => l_2(n.results.phase, !!n.results.exception.error));
      let _e = g_1(() =>
        [`running`, `stopping`, `ended`, `error`].includes(n.results.phase),
      );
      let ye = g_1(() => {
        switch (n.results.phase) {
          case `running`:
            return {
              label: `Running`,
              dot: `bg-emerald-500`,
              ping: `bg-emerald-400`,
              pulse: true,
            };
          case `stopping`:
            return {
              label: `Stopping`,
              dot: `bg-amber-500`,
              ping: `bg-amber-400`,
              pulse: true,
            };
          case `error`:
            return {
              label: `Error`,
              dot: `bg-rose-500`,
              ping: ``,
              pulse: false,
            };
          default:
            return {
              label: `Ended`,
              dot: `bg-gray-400 dark:bg-gray-500`,
              ping: ``,
              pulse: false,
            };
        }
      });
      let be = g_1(() => {
        let e = n.results.generalInfo || {};
        if (
          !e.started_at ||
          !e.current_time ||
          e.current_time <= e.started_at
        ) {
          return ``;
        }
        let t = Math.floor((e.current_time - e.started_at) / 60000);
        let r = Math.floor(t / 1440);
        let i = Math.floor((t % 1440) / 60);
        if (r > 0) {
          return `${r}d ${i}h`;
        }
        if (i > 0) {
          return `${i}h ${t % 60}m`;
        }
        return `${t}m`;
      });
      let Te = g_1(() => (n.results.generalInfo.count_error_logs ?? 0) > 0);
      function Ee(e) {
        if (e >= 1000) {
          return `${(e / 1000).toFixed(e >= 10000 ? 0 : 1)}k`;
        }
        return String(e);
      }
      let Oe = (e) => {
        if (e) {
          return w.timestampToTime(e);
        }
        return `-`;
      };
      let Z = vn_1([]);
      async function Q() {
        if (n.results.phase === `editing`) {
          if (!n.form.paper_mode) {
            let e = J.exchangeApiKeys.find(
              (e) => e.id === n.form.exchange_api_key_id,
            );
            if (e) {
              n.form.exchange = e.exchange;
            }
          }
          try {
            Z.value = await t_2().getExchangeSupportedSymbols(n.form.exchange);
            for (let e = 0; e < n.form.routes.length; e++) {
              if (!Z.value.includes(n.form.routes[e].symbol)) {
                n.form.routes[e].symbol = Z.value[0];
              }
            }
            if (n.form.data_routes.length > 0) {
              for (let e = 0; e < n.form.data_routes.length; e++) {
                if (!Z.value.includes(n.form.data_routes[e].symbol)) {
                  n.form.data_routes[e].symbol = Z.value[0];
                }
              }
            }
          } catch (e) {
            console.error(`Error updating supported symbols:`, e);
          }
        }
      }
      ct_1(async () => {
        Y.ensureTabConfig(n.session);
        setTimeout(async () => {
          if (
            n.form.exchange &&
            (n.results.phase === `editing` || !Z.value.length)
          ) {
            await Q();
          }
        }, 200);
        if ([`running`, `stopping`, `ended`].includes(n.results.phase)) {
          await Y.fetchEquityCurve(n.session, K.value);
        }
      });
      Ht_1(
        () => n.form.exchange,
        async (e, t) => {
          if (e !== t) {
            Y.ensureTabConfig(n.session, !n.form.config?.exchange.name);
            await Q();
          }
        },
      );
      Ht_1(
        () => n.form.paper_mode,
        (e, t) => {
          if (e !== t) {
            Y.ensureTabConfig(n.session);
          }
        },
      );
      Ht_1(
        () => n.results.phase,
        async (e) => {
          if (e === `editing`) {
            await Q();
          }
        },
      );
      let Fe = X_1(() => {
        if (n.results.phase === `editing`) {
          Y.saveState(n.session);
        }
      }, 1000);
      Ht_1(
        () => n.form,
        () => {
          Fe();
        },
        {
          deep: true,
        },
      );
      Ht_1(
        () => n.form.exchange_api_key_id,
        async (e, t) => {
          if (e !== t) {
            Y.ensureTabConfig(n.session, !n.form.config?.exchange.name);
            await Q();
          }
        },
      );
      Ht_1(U, async (e) => {
        if (e) {
          let e = await Y.getSessionData(n.session);
          if (e?.session) {
            ae.value = e.session.title || null;
            G.value = e.session.description || null;
          }
        }
      });
      function onSaved(e) {
        n.results.generalInfo.title = e.title || null;
        n.results.generalInfo.description = e.description || null;
      }
      let Re = g_1(
        () => n.results.generalInfo?.exchange || n.form.exchange || `-`,
      );
      let ze = g_1(() => {
        let e = n.results.generalInfo || {};
        let t =
          e.pnl !== undefined &&
          e.pnl !== null &&
          e.pnl_perc !== undefined &&
          e.pnl_perc !== null;
        let r = `text-gray-700 dark:text-gray-200`;
        let color =
          t && e.pnl > 0
            ? `text-emerald-500`
            : t && e.pnl < 0
              ? `text-rose-500`
              : r;
        return [
          {
            label: `PNL`,
            value: t ? `${e.pnl_perc}%` : `-`,
            color,
          },
          {
            label: `Trades`,
            value: `${e.count_trades ?? 0}`,
            color: r,
          },
          {
            label: `Balance`,
            value: e.current_balance ?? `-`,
            color: r,
          },
        ];
      });
      let Be = g_1(
        () =>
          n.results.watchlist[
            `${n.form.exchange}-${n.results.selectedRoute?.symbol}-${n.results.selectedRoute?.timeframe}`
          ] ?? [],
      );
      let Ve = g_1(() => {
        let e = n.results.generalInfo || {};
        let t = e.started_at || n.results.generalInfo?.started_at;
        let r =
          e.pnl !== undefined &&
          e.pnl !== null &&
          e.pnl_perc !== undefined &&
          e.pnl_perc !== null;
        let i = [
          {
            label: `Current Time`,
            value: Oe(e.current_time),
          },
          {
            label: `Debug Mode`,
            value: e.debug_mode ?? n.form.debug_mode ?? `-`,
          },
          {
            label: `Paper Trade`,
            value: e.paper_mode ?? n.form.paper_mode ?? `-`,
          },
          {
            label: `PNL`,
            value: r ? `${e.pnl} (${e.pnl_perc}%)` : `-`,
          },
          {
            label: `Started`,
            value: Oe(t),
          },
          {
            label: `Started Balance`,
            value: e.started_balance ?? `-`,
          },
        ];
        let a = e.leverage_type || `spot`;
        if (a !== `spot`) {
          i.push({
            label: `Available Margin`,
            value: `${e.available_margin ?? `-`}`,
          });
          i.push({
            label: `Leverage`,
            value: `${e.leverage ?? `-`}x (${a})`,
          });
        }
        return i;
      });
      let Ue = g_1(() => dt(J.notificationApiKeys));
      let Ke = g_1({
        get: () => $(n.form.notification_api_key_id),
        set: (e) => {
          n.form.notification_api_key_id = ft(e);
        },
      });
      let qe = g_1(() => {
        if (
          Math.round(n.results.progressbar.estimated_remaining_seconds) === 0
        ) {
          return `Please wait...`;
        }
        return `${Math.round(n.results.progressbar.estimated_remaining_seconds)} seconds remaining...`;
      });
      let Je = g_1(() => {
        let e = [];
        let J_jesseSupportedTimeframes = J.jesseSupportedTimeframes;
        e =
          n.form.config?.generate_candles_from_1m || !n.form.exchange
            ? J_jesseSupportedTimeframes.map((e) => {
                if (J.planLimits.timeframes.includes(e)) {
                  return {
                    label: e,
                    value: e,
                    disabled: false,
                  };
                }
                return {
                  label: `${e} (Upgrade required)`,
                  value: e,
                  disabled: true,
                };
              })
            : J.exchangeInfo[n.form.exchange].supported_timeframes.map((e) => {
                if (J.planLimits.timeframes.includes(e)) {
                  return {
                    label: e,
                    value: e,
                    disabled: false,
                  };
                }
                return {
                  label: `${e} (Upgrade required)`,
                  value: e,
                  disabled: true,
                };
              });
        return e;
      });
      let Ye = g_1(() =>
        J.liveTradingExchangeNames.map((e) => {
          if (J.planLimits.exchanges.includes(e)) {
            return {
              label: e,
              value: e,
              disabled: false,
            };
          }
          return {
            label: `${e} (Upgrade required)`,
            value: e,
            disabled: true,
          };
        }),
      );
      let Xe = g_1(() =>
        J.exchangeApiKeys.map((e) => {
          if (J.planLimits.exchanges.includes(e.exchange)) {
            return {
              label: `${e.exchange} - ${e.name}`,
              value: e.id,
              disabled: false,
            };
          }
          return {
            label: `${e.exchange} - ${e.name} (Upgrade required)`,
            value: e.id,
            disabled: true,
          };
        }),
      );
      let Y_cancel = Y.cancel;
      let Y_newLive = Y.newLive;
      function $e(e) {
        Y.start(e);
      }
      function et(e) {
        Y.closeTab(e);
      }
      async function tt() {
        if (
          n.results.infoLogs === `` &&
          n.results.generalInfo.count_info_logs > 0
        ) {
          await Y.fetchLogs(n.session);
        }
        A.value = true;
      }
      async function nt() {
        if (
          n.results.errorLogs === `` &&
          n.results.generalInfo.count_error_logs > 0
        ) {
          await Y.fetchLogs(n.session);
        }
        j.value = true;
      }
      async function it() {
        g.value = true;
        if (!(await w.copyToClipboard(n.results.infoLogs)).success) {
          O(`error`, `Failed to copy logs`);
          return;
        }
        O(`success`, `Logs copied successfully`);
        E.value = true;
        setTimeout(() => {
          E.value = false;
        }, 3000);
      }
      async function at() {
        T.value = true;
        if (!(await w.copyToClipboard(n.results.errorLogs)).success) {
          O(`error`, `Failed to copy logs`);
          return;
        }
        O(`success`, `Logs copied successfully`);
        D.value = true;
        setTimeout(() => {
          D.value = false;
        }, 3000);
      }
      function ot() {
        let e = `/live/download-log/${n.session}?token=${J_authToken}`;
        if (X.value !== `/`) {
          e = X.value + e;
        }
        window.open(e, `_blank`);
      }
      let st = g_1(() =>
        [
          `basic`,
          `pro`,
          `enterprise`,
          `basic-lifetime`,
          `pro-lifetime`,
          `enterprise-lifetime`,
          `lifetime`,
        ].includes(J.plan),
      );
      function onTradeClick(e) {
        ee.value = e;
        N.value = true;
      }
      function onOrderClick(e) {
        V.value = e;
        B.value = true;
      }
      function On(e) {
        H.value = e;
        if (e === `trades`) {
          kn();
        }
      }
      async function kn() {
        let e = await Y.fetchTrades(n.session);
        if (e) {
          n.results.trades = e;
        }
      }
      async function An(e) {
        K.value = e;
        await Y.fetchEquityCurve(n.session, e);
      }
      Ht_1(
        () => n.results.phase,
        async (e) => {
          if ([`running`, `stopping`, `ended`].includes(e)) {
            await Y.fetchEquityCurve(n.session, K.value);
          }
        },
        {
          immediate: true,
        },
      );
      return (t, n) => {
        let o = t_24;
        let p = t_26;
        let h = Le;
        let g = t_17;
        let C = t_27;
        let T = t_18;
        let M = t_9;
        let P = n_4;
        let F = t_8;
        let I = t_12;
        let L = i;
        let R = t_11;
        let z = b_2;
        let q = r_4;
        let J = He;
        let se = i_3;
        let X = t_28;
        let Oe = t_14;
        let Q = t_25;
        let Fe = We;
        let dt = Ge;
        let $ = t_19;
        let ft = t_22;
        let jn = t_29;
        let Mn = rt;
        mt_1();
        return b(
          o_1,
          null,
          [
            D_1(
              o,
              {
                modelValue: On_1(N),
                "onUpdate:modelValue": (n[0] ||= (e) => {
                  if (un_1(N)) {
                    return (N.value = e);
                  }
                  return null;
                }),
                "trade-id": On_1(ee),
                onOrderClick,
              },
              null,
              8,
              [`modelValue`, `trade-id`],
            ),
            D_1(
              p,
              {
                modelValue: On_1(B),
                "onUpdate:modelValue": (n[1] ||= (e) => {
                  if (un_1(B)) {
                    return (B.value = e);
                  }
                  return null;
                }),
                "order-id": On_1(V),
              },
              null,
              8,
              [`modelValue`, `order-id`],
            ),
            D_1(
              g,
              {
                modelValue: On_1(k),
                "onUpdate:modelValue": (n[3] ||= (e) => {
                  if (un_1(k)) {
                    return (k.value = e);
                  }
                  return null;
                }),
                size: `small`,
                title: `Report an issue`,
              },
              {
                default: qt_1(() => [
                  D_1(
                    h,
                    {
                      session: e.session,
                      onClose: (n[2] ||= (e) => (k.value = false)),
                    },
                    null,
                    8,
                    [`session`],
                  ),
                ]),
                _: 1,
              },
              8,
              [`modelValue`],
            ),
            D_1(
              g,
              {
                modelValue: On_1(A),
                "onUpdate:modelValue": (n[4] ||= (e) => {
                  if (un_1(A)) {
                    return (A.value = e);
                  }
                  return null;
                }),
                title: `Info Logs`,
              },
              {
                default: qt_1(() => [
                  D_1(
                    C,
                    {
                      logs: e.results.infoLogs,
                    },
                    null,
                    8,
                    [`logs`],
                  ),
                ]),
                buttons: qt_1(() => [
                  _(
                    `button`,
                    {
                      type: `button`,
                      "aria-label": On_1(E)
                        ? `Info logs copied`
                        : `Copy info logs`,
                      class: `ml-2 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-hidden`,
                      onClick: it,
                    },
                    [
                      On_1(E)
                        ? (mt_1(),
                          v_1(On_1(r_5), {
                            key: 0,
                            class: `h-6 w-6`,
                            "aria-hidden": `true`,
                          }))
                        : y(``, true),
                      !On_1(E) && e.results.infoLogs.length != 0
                        ? (mt_1(),
                          v_1(On_1(p_1), {
                            key: 1,
                            class: `h-6 w-6`,
                            "aria-hidden": `true`,
                          }))
                        : y(``, true),
                    ],
                    8,
                    pt,
                  ),
                  _(
                    `button`,
                    {
                      type: `button`,
                      "aria-label": `Download logs`,
                      class: `ml-2 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-hidden`,
                      onClick: ot,
                    },
                    [
                      e.results.infoLogs.length == 0
                        ? y(``, true)
                        : (mt_1(),
                          v_1(On_1(t_4), {
                            key: 0,
                            class: `h-6 w-6`,
                            "aria-hidden": `true`,
                          })),
                    ],
                  ),
                ]),
                _: 1,
              },
              8,
              [`modelValue`],
            ),
            D_1(
              g,
              {
                modelValue: On_1(j),
                "onUpdate:modelValue": (n[5] ||= (e) => {
                  if (un_1(j)) {
                    return (j.value = e);
                  }
                  return null;
                }),
                title: `Error Logs`,
              },
              {
                default: qt_1(() => [
                  D_1(
                    C,
                    {
                      logs: e.results.errorLogs,
                    },
                    null,
                    8,
                    [`logs`],
                  ),
                ]),
                buttons: qt_1(() => [
                  _(
                    `button`,
                    {
                      type: `button`,
                      "aria-label": On_1(D)
                        ? `Error logs copied`
                        : `Copy error logs`,
                      class: `ml-2 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-hidden`,
                      onClick: at,
                    },
                    [
                      On_1(D)
                        ? (mt_1(),
                          v_1(On_1(r_5), {
                            key: 0,
                            class: `h-6 w-6`,
                            "aria-hidden": `true`,
                          }))
                        : y(``, true),
                      !On_1(D) && e.results.errorLogs.length != 0
                        ? (mt_1(),
                          v_1(On_1(p_1), {
                            key: 1,
                            class: `h-6 w-6`,
                            "aria-hidden": `true`,
                          }))
                        : y(``, true),
                    ],
                    8,
                    mt,
                  ),
                  _(
                    `button`,
                    {
                      type: `button`,
                      "aria-label": `Download logs`,
                      class: `ml-2 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-hidden`,
                      onClick: ot,
                    },
                    [
                      e.results.errorLogs.length == 0
                        ? y(``, true)
                        : (mt_1(),
                          v_1(On_1(t_4), {
                            key: 0,
                            class: `h-6 w-6`,
                            "aria-hidden": `true`,
                          })),
                    ],
                  ),
                ]),
                _: 1,
              },
              8,
              [`modelValue`],
            ),
            e.results.phase === `starting`
              ? (mt_1(),
                b(`div`, ht, [
                  D_1(
                    T,
                    {
                      progress: e.results.progressbar.current,
                      "status-text": e.results.exception.error
                        ? undefined
                        : On_1(qe),
                    },
                    null,
                    8,
                    [`progress`, `status-text`],
                  ),
                  _(`div`, gt, [
                    e.form.debug_mode
                      ? (mt_1(),
                        v_1(M, {
                          key: 0,
                          icon: `i-heroicons-clipboard-document-list`,
                          variant: `solid`,
                          label: `View Logs`,
                          class: `flex justify-center w-64`,
                          onClick: (n[6] ||= (e) => (A.value = true)),
                        }))
                      : y(``, true),
                    D_1(M, {
                      color: `neutral`,
                      class: `w-64 flex justify-center mt-4 text-rose-500 dark:text-rose-400`,
                      icon: `i-heroicons-no-symbol`,
                      variant: `soft`,
                      label: `Cancel`,
                      trailing: false,
                      onClick: (n[7] ||= (e) =>
                        On_1(Y_cancel)(
                          (t._.provides[wt_1] || t.$route).params.id,
                        )),
                    }),
                  ]),
                  e.results.exception.error
                    ? (mt_1(),
                      b(`div`, _t, [
                        D_1(
                          P,
                          {
                            modelValue: On_1(m),
                            "onUpdate:modelValue": (n[8] ||= (e) => {
                              if (un_1(m)) {
                                return (m.value = e);
                              }
                              return null;
                            }),
                            title: e.results.exception.error,
                            content: e.results.exception.traceback,
                            mode: `live`,
                            "debug-mode": e.form.debug_mode,
                          },
                          null,
                          8,
                          [`modelValue`, `title`, `content`, `debug-mode`],
                        ),
                      ]))
                    : y(``, true),
                ]))
              : (mt_1(),
                b(`div`, vt, [
                  _(`div`, yt, [
                    D_1(
                      ft,
                      {
                        compact: ``,
                      },
                      {
                        left: qt_1(() => [
                          e.results.phase === `editing`
                            ? (mt_1(),
                              b(`div`, bt, [
                                D_1(
                                  I,
                                  {
                                    title: `Exchange`,
                                  },
                                  {
                                    default: qt_1(() => [
                                      e.form.paper_mode
                                        ? (mt_1(),
                                          v_1(
                                            F,
                                            {
                                              key: 0,
                                              modelValue: e.form.exchange,
                                              "onUpdate:modelValue": (n[9] ||= (
                                                t,
                                              ) => (e.form.exchange = t)),
                                              placeholder: `Select an exchange...`,
                                              items: On_1(Ye),
                                              "value-key": `value`,
                                            },
                                            null,
                                            8,
                                            [`modelValue`, `items`],
                                          ))
                                        : (mt_1(),
                                          v_1(
                                            F,
                                            {
                                              key: 1,
                                              modelValue:
                                                e.form.exchange_api_key_id,
                                              "onUpdate:modelValue": (n[11] ||=
                                                (t) =>
                                                  (e.form.exchange_api_key_id =
                                                    t)),
                                              placeholder: `Select an exchange...`,
                                              items: On_1(Xe),
                                              "value-key": `value`,
                                            },
                                            {
                                              empty: qt_1(() => [
                                                _(`div`, xt, [
                                                  (n[25] ||= _(
                                                    `span`,
                                                    null,
                                                    ` No exchange API keys found. Please add at least one: `,
                                                    -1,
                                                  )),
                                                  D_1(M, {
                                                    icon: `i-heroicons-plus`,
                                                    type: `button`,
                                                    variant: `solid`,
                                                    size: `sm`,
                                                    label: `Add Exchange API Key`,
                                                    onClick: (n[10] ||= (e) =>
                                                      On_1(a).openSettings(
                                                        `Exchange API keys`,
                                                      )),
                                                  }),
                                                ]),
                                              ]),
                                              _: 1,
                                            },
                                            8,
                                            [`modelValue`, `items`],
                                          )),
                                    ]),
                                    _: 1,
                                  },
                                ),
                                D_1(
                                  L,
                                  {
                                    "total-routes-error": On_1(l),
                                    form: e.form,
                                    mode: `live`,
                                    symbols: On_1(Z),
                                    timeframes: On_1(Je),
                                  },
                                  null,
                                  8,
                                  [
                                    `total-routes-error`,
                                    `form`,
                                    `symbols`,
                                    `timeframes`,
                                  ],
                                ),
                                D_1(
                                  I,
                                  {
                                    title: `Options`,
                                    help: `Configure debugging, paper trading, and notifications for this session.`,
                                  },
                                  {
                                    default: qt_1(() => [
                                      _(`div`, St, [
                                        D_1(
                                          R,
                                          {
                                            modelValue: e.form.debug_mode,
                                            "onUpdate:modelValue": (n[12] ||= (
                                              t,
                                            ) => (e.form.debug_mode = t)),
                                            compact: ``,
                                            title: `Debug Mode`,
                                            description: `Logs more details, helpful for debugging.`,
                                          },
                                          null,
                                          8,
                                          [`modelValue`],
                                        ),
                                        D_1(
                                          R,
                                          {
                                            modelValue: e.form.paper_mode,
                                            "onUpdate:modelValue": (n[13] ||= (
                                              t,
                                            ) => (e.form.paper_mode = t)),
                                            compact: ``,
                                            title: `Paper Trade`,
                                            disabled: !On_1(st),
                                            "disabled-guide": On_1(st)
                                              ? ``
                                              : `Premium plan required`,
                                            description: `Trade in real-time using actual exchange data with PAPER money.`,
                                          },
                                          null,
                                          8,
                                          [
                                            `modelValue`,
                                            `disabled`,
                                            `disabled-guide`,
                                          ],
                                        ),
                                        D_1(
                                          z,
                                          {
                                            class: `lg:col-span-2`,
                                            title: `Notifications`,
                                            description: `Select a notification driver for this session.`,
                                            "control-class": `w-full min-w-0 shrink-0 sm:w-72`,
                                          },
                                          {
                                            default: qt_1(() => [
                                              D_1(
                                                F,
                                                {
                                                  modelValue: On_1(Ke),
                                                  "onUpdate:modelValue":
                                                    (n[15] ||= (e) => {
                                                      if (un_1(Ke)) {
                                                        return (Ke.value = e);
                                                      }
                                                      return null;
                                                    }),
                                                  class: `w-full sm:w-72 sm:shrink-0`,
                                                  placeholder: `No notifications`,
                                                  items: On_1(Ue),
                                                  "search-input": false,
                                                  "value-key": `value`,
                                                },
                                                {
                                                  empty: qt_1(() => [
                                                    _(`div`, Ct, [
                                                      (n[26] ||= _(
                                                        `span`,
                                                        null,
                                                        ` No notification API keys found. Please add at least one: `,
                                                        -1,
                                                      )),
                                                      D_1(M, {
                                                        icon: `i-heroicons-plus`,
                                                        type: `button`,
                                                        variant: `solid`,
                                                        size: `sm`,
                                                        label: `Add Notification API Key`,
                                                        onClick: (n[14] ||= (
                                                          e,
                                                        ) =>
                                                          On_1(a).openSettings(
                                                            `Notification API keys`,
                                                          )),
                                                      }),
                                                    ]),
                                                  ]),
                                                  _: 1,
                                                },
                                                8,
                                                [`modelValue`, `items`],
                                              ),
                                            ]),
                                            _: 1,
                                          },
                                        ),
                                      ]),
                                    ]),
                                    _: 1,
                                  },
                                ),
                                e.form.config
                                  ? (mt_1(),
                                    v_1(
                                      q,
                                      {
                                        key: 0,
                                        "bulk-apply-count": On_1(ce),
                                        "bulk-apply-description": `Copy shared settings to other finished or editable Live and Paper tabs. Exchange-specific values are copied only where the destination supports them.`,
                                        onBulkApply,
                                      },
                                      {
                                        default: qt_1(() => [
                                          D_1(
                                            lt,
                                            {
                                              config: e.form.config,
                                              exchange: e.form.exchange,
                                              "paper-mode": e.form.paper_mode,
                                            },
                                            null,
                                            8,
                                            [
                                              `config`,
                                              `exchange`,
                                              `paper-mode`,
                                            ],
                                          ),
                                        ]),
                                        _: 1,
                                      },
                                      8,
                                      [`bulk-apply-count`],
                                    ))
                                  : y(``, true),
                              ]))
                            : y(``, true),
                          [`running`, `stopping`, `ended`, `error`].includes(
                            e.results.phase,
                          )
                            ? (mt_1(),
                              b(`div`, wt, [
                                e.results.exception.error
                                  ? (mt_1(),
                                    b(`div`, Tt, [
                                      D_1(
                                        P,
                                        {
                                          title: e.results.exception.error,
                                          content:
                                            e.results.exception.traceback,
                                          mode: `live`,
                                          "debug-mode": e.form.debug_mode,
                                        },
                                        null,
                                        8,
                                        [`title`, `content`, `debug-mode`],
                                      ),
                                    ]))
                                  : y(``, true),
                                _(`div`, Et, [
                                  On_1(pe)
                                    ? (mt_1(),
                                      v_1(
                                        J,
                                        {
                                          key: 0,
                                          results: e.results,
                                          form: e.form,
                                        },
                                        null,
                                        8,
                                        [`results`, `form`],
                                      ))
                                    : y(``, true),
                                  [`running`, `stopping`, `ended`].includes(
                                    e.results.phase,
                                  )
                                    ? (mt_1(),
                                      b(`div`, Dt, [
                                        _(`div`, Ot, [
                                          (n[27] ||= _(
                                            `h3`,
                                            {
                                              class: `min-w-0 text-sm font-semibold text-gray-900 dark:text-white`,
                                            },
                                            `Equity curve`,
                                            -1,
                                          )),
                                          _(`div`, kt, [
                                            (mt_1(),
                                            b(
                                              o_1,
                                              null,
                                              bt_1(
                                                [
                                                  `1m`,
                                                  `5m`,
                                                  `15m`,
                                                  `1h`,
                                                  `1d`,
                                                  `auto`,
                                                ],
                                                (e) =>
                                                  _(
                                                    `button`,
                                                    {
                                                      key: e,
                                                      class: Qn([
                                                        `rounded-md px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide transition-colors duration-200`,
                                                        [
                                                          On_1(K) === e
                                                            ? `bg-white text-gray-900 shadow-xs dark:bg-gray-700 dark:text-white`
                                                            : `text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200`,
                                                        ],
                                                      ]),
                                                      onClick: (t) => An(e),
                                                    },
                                                    nr(e.toUpperCase()),
                                                    11,
                                                    At,
                                                  ),
                                              ),
                                              64,
                                            )),
                                          ]),
                                        ]),
                                        _(`div`, jt, [
                                          e.results.charts.equity_curve
                                            .length === 0
                                            ? (mt_1(),
                                              b(`div`, Mt, [
                                                D_1(se, {
                                                  name: `i-heroicons-presentation-chart-line`,
                                                  class: `size-6 text-gray-300 dark:text-gray-600`,
                                                }),
                                                (n[28] ||= _(
                                                  `p`,
                                                  {
                                                    class: `text-sm text-gray-500 dark:text-gray-400`,
                                                  },
                                                  ` No equity data yet. It should appear shortly after the session starts (usually within ~1 minute). `,
                                                  -1,
                                                )),
                                              ]))
                                            : (mt_1(),
                                              v_1(
                                                X,
                                                {
                                                  key: 1,
                                                  data: e.results.charts
                                                    .equity_curve,
                                                },
                                                null,
                                                8,
                                                [`data`],
                                              )),
                                        ]),
                                      ]))
                                    : y(``, true),
                                  _(`div`, Nt, [
                                    _(`div`, Pt, [
                                      (mt_1(true),
                                      b(
                                        o_1,
                                        null,
                                        bt_1(
                                          [
                                            {
                                              id: `positions`,
                                              label: `Positions`,
                                              count:
                                                e.results.generalInfo
                                                  .open_positions,
                                              icon: `i-heroicons-chart-bar`,
                                            },
                                            {
                                              id: `trades`,
                                              label: `Trades`,
                                              count:
                                                e.results.generalInfo
                                                  .count_trades,
                                              icon: `i-heroicons-arrows-right-left`,
                                            },
                                            {
                                              id: `orders`,
                                              label: `Orders`,
                                              count:
                                                e.results.generalInfo
                                                  .count_active_orders,
                                              icon: `i-heroicons-list-bullet`,
                                            },
                                          ],
                                          (e) => {
                                            mt_1();
                                            return b(
                                              `button`,
                                              {
                                                key: e.id,
                                                class: Qn([
                                                  `flex-1 flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg select-none group focus:outline-hidden transition-colors duration-200`,
                                                  [
                                                    On_1(H) === e.id
                                                      ? `bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 shadow-xs`
                                                      : `text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50 border border-transparent`,
                                                  ],
                                                ]),
                                                onClick: (t) => On(e.id),
                                              },
                                              [
                                                e.id === `positions` &&
                                                e.count > 0
                                                  ? (mt_1(), b(`div`, It))
                                                  : (mt_1(),
                                                    v_1(
                                                      se,
                                                      {
                                                        key: 1,
                                                        name: e.icon,
                                                        class: `w-4 h-4 shrink-0`,
                                                      },
                                                      null,
                                                      8,
                                                      [`name`],
                                                    )),
                                                _(
                                                  `span`,
                                                  Lt,
                                                  nr(e.label.toUpperCase()),
                                                  1,
                                                ),
                                                e.count > 0
                                                  ? (mt_1(),
                                                    v_1(
                                                      Oe,
                                                      {
                                                        key: 2,
                                                        color: `neutral`,
                                                        variant: `solid`,
                                                        size: `xs`,
                                                        class: `ml-1 px-1.5 py-0 min-w-[1.25rem] flex justify-center text-[10px] font-black rounded-md`,
                                                      },
                                                      {
                                                        default: qt_1(() => [
                                                          E_1(nr(e.count), 1),
                                                        ]),
                                                        _: 2,
                                                      },
                                                      1024,
                                                    ))
                                                  : y(``, true),
                                              ],
                                              10,
                                              Ft,
                                            );
                                          },
                                        ),
                                        128,
                                      )),
                                    ]),
                                    _(`div`, Rt, [
                                      On_1(H) === `positions`
                                        ? (mt_1(),
                                          v_1(
                                            Q,
                                            {
                                              key: 0,
                                              data: e.results.positions,
                                              "header-items": [
                                                `Symbol`,
                                                `QTY`,
                                                `Entry`,
                                                `Price`,
                                                `Liq Price`,
                                                `PNL`,
                                              ],
                                              header: ``,
                                              scrollable: ``,
                                              "scroll-label": `Live positions`,
                                            },
                                            null,
                                            8,
                                            [`data`],
                                          ))
                                        : y(``, true),
                                      On_1(H) === `trades`
                                        ? (mt_1(),
                                          v_1(
                                            Fe,
                                            {
                                              key: 1,
                                              trades: e.results.trades,
                                              "session-id": e.session,
                                              onTradeClick,
                                              onReload: kn,
                                            },
                                            null,
                                            8,
                                            [`trades`, `session-id`],
                                          ))
                                        : y(``, true),
                                      On_1(H) === `orders`
                                        ? (mt_1(),
                                          v_1(
                                            dt,
                                            {
                                              key: 2,
                                              orders: e.results.orders,
                                              onOrderClick,
                                            },
                                            null,
                                            8,
                                            [`orders`],
                                          ))
                                        : y(``, true),
                                    ]),
                                  ]),
                                ]),
                              ]))
                            : y(``, true),
                        ]),
                        right: qt_1(() => [
                          On_1(_e)
                            ? (mt_1(),
                              b(`div`, zt, [
                                _(`div`, Bt, [
                                  _(`div`, Vt, [
                                    _(`span`, Ht, [
                                      On_1(ye).pulse
                                        ? (mt_1(),
                                          b(
                                            `span`,
                                            {
                                              key: 0,
                                              class: Qn([
                                                `absolute inline-flex h-full w-full animate-ping rounded-full opacity-75`,
                                                On_1(ye).ping,
                                              ]),
                                            },
                                            null,
                                            2,
                                          ))
                                        : y(``, true),
                                      _(
                                        `span`,
                                        {
                                          class: Qn([
                                            `relative inline-flex size-2 rounded-full`,
                                            On_1(ye).dot,
                                          ]),
                                        },
                                        null,
                                        2,
                                      ),
                                    ]),
                                    _(`span`, Ut, nr(On_1(ye).label), 1),
                                    On_1(be)
                                      ? (mt_1(), b(`span`, Wt, nr(On_1(be)), 1))
                                      : y(``, true),
                                  ]),
                                  e.results.phase === `ended` ||
                                  e.results.phase === `error`
                                    ? (mt_1(),
                                      v_1(M, {
                                        key: 0,
                                        size: `xs`,
                                        variant: `solid`,
                                        icon: `i-heroicons-plus`,
                                        label: `New session`,
                                        class: `shrink-0`,
                                        onClick: (n[16] ||= (e) =>
                                          On_1(Y_newLive)(
                                            (t._.provides[wt_1] || t.$route)
                                              .params.id,
                                          )),
                                      }))
                                    : (mt_1(),
                                      v_1(
                                        M,
                                        {
                                          key: 1,
                                          size: `xs`,
                                          color: `neutral`,
                                          variant: `ghost`,
                                          icon: `i-heroicons-no-symbol`,
                                          label:
                                            e.results.phase === `stopping`
                                              ? `Stopping...`
                                              : `Stop`,
                                          loading:
                                            e.results.phase === `stopping`,
                                          class: `shrink-0 text-rose-500 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10`,
                                          onClick: (n[17] ||= (e) =>
                                            On_1(Y).openStopConfirmModal(
                                              (t._.provides[wt_1] || t.$route)
                                                .params.id,
                                            )),
                                        },
                                        null,
                                        8,
                                        [`label`, `loading`],
                                      )),
                                ]),
                                _(`div`, Gt, [
                                  D_1($, {
                                    label: `Trade chart`,
                                    icon: `i-heroicons-chart-bar-square`,
                                    onClick: (n[18] ||= (e) =>
                                      (W.value = true)),
                                  }),
                                  D_1(
                                    $,
                                    {
                                      label: `Logs`,
                                      icon: `i-heroicons-clipboard-document-list`,
                                      onClick: tt,
                                    },
                                    {
                                      trailing: qt_1(() => [
                                        e.results.generalInfo.count_info_logs
                                          ? (mt_1(),
                                            b(
                                              `span`,
                                              Kt,
                                              nr(
                                                Ee(
                                                  e.results.generalInfo
                                                    .count_info_logs,
                                                ),
                                              ),
                                              1,
                                            ))
                                          : y(``, true),
                                      ]),
                                      _: 1,
                                    },
                                  ),
                                  D_1(
                                    $,
                                    {
                                      label: `Errors`,
                                      icon: `i-heroicons-exclamation-triangle`,
                                      "icon-class": On_1(Te)
                                        ? `text-rose-500 dark:text-rose-400`
                                        : undefined,
                                      onClick: nt,
                                    },
                                    {
                                      trailing: qt_1(() => [
                                        On_1(Te)
                                          ? (mt_1(),
                                            b(
                                              `span`,
                                              qt,
                                              nr(
                                                Ee(
                                                  e.results.generalInfo
                                                    .count_error_logs,
                                                ),
                                              ),
                                              1,
                                            ))
                                          : y(``, true),
                                      ]),
                                      _: 1,
                                    },
                                    8,
                                    [`icon-class`],
                                  ),
                                  D_1(
                                    $,
                                    {
                                      label: `Trades history`,
                                      icon: `i-heroicons-arrows-right-left`,
                                      to: `/live/trades-history?id=${e.session}`,
                                    },
                                    null,
                                    8,
                                    [`to`],
                                  ),
                                  D_1(
                                    $,
                                    {
                                      label: `Orders history`,
                                      icon: `i-heroicons-list-bullet`,
                                      to: `/live/orders-history?id=${e.session}`,
                                    },
                                    null,
                                    8,
                                    [`to`],
                                  ),
                                  D_1($, {
                                    label: `Report an issue`,
                                    icon: `i-heroicons-flag`,
                                    onClick: (n[19] ||= (e) =>
                                      (k.value = true)),
                                  }),
                                ]),
                              ]))
                            : (mt_1(),
                              b(`div`, Jt, [
                                D_1(
                                  I,
                                  {
                                    title: `Summary`,
                                    flush: ``,
                                    "overflow-hidden": ``,
                                    selectable: ``,
                                  },
                                  {
                                    footer: qt_1(() => [
                                      D_1(M, {
                                        block: ``,
                                        icon: `i-heroicons-bolt`,
                                        variant: `solid`,
                                        size: `lg`,
                                        label: `Start live session`,
                                        trailing: false,
                                        onClick: (n[20] ||= (e) =>
                                          $e(
                                            (t._.provides[wt_1] || t.$route)
                                              .params.id,
                                          )),
                                      }),
                                      Object.keys(e.tabs).length > 1
                                        ? (mt_1(),
                                          v_1(M, {
                                            key: 0,
                                            block: ``,
                                            class: `mt-2 md:hidden`,
                                            color: `neutral`,
                                            icon: `i-heroicons-x-mark`,
                                            variant: `ghost`,
                                            size: `lg`,
                                            label: `Close tab`,
                                            trailing: false,
                                            onClick: (n[21] ||= (e) =>
                                              et(
                                                (t._.provides[wt_1] || t.$route)
                                                  .params.id,
                                              )),
                                          }))
                                        : y(``, true),
                                    ]),
                                    default: qt_1(() => [
                                      _(`dl`, Yt, [
                                        _(`div`, Xt, [
                                          (n[29] ||= _(
                                            `dt`,
                                            {
                                              class: `font-medium text-gray-500 dark:text-gray-400`,
                                            },
                                            `Mode:`,
                                            -1,
                                          )),
                                          _(
                                            `dd`,
                                            Zt,
                                            nr(
                                              e.form.paper_mode
                                                ? `Paper trading`
                                                : `Live trading`,
                                            ),
                                            1,
                                          ),
                                        ]),
                                        _(`div`, Qt, [
                                          (n[30] ||= _(
                                            `dt`,
                                            {
                                              class: `font-medium text-gray-500 dark:text-gray-400`,
                                            },
                                            `Exchange:`,
                                            -1,
                                          )),
                                          _(
                                            `dd`,
                                            $t,
                                            nr(e.form.exchange || `-`),
                                            1,
                                          ),
                                        ]),
                                        _(`div`, en, [
                                          (n[31] ||= _(
                                            `dt`,
                                            {
                                              class: `font-medium text-gray-500 dark:text-gray-400`,
                                            },
                                            `Routes:`,
                                            -1,
                                          )),
                                          _(
                                            `dd`,
                                            tn,
                                            nr(e.form.routes.length) +
                                              ` trading · ` +
                                              nr(e.form.data_routes.length) +
                                              ` data `,
                                            1,
                                          ),
                                        ]),
                                        _(`div`, nn, [
                                          (n[32] ||= _(
                                            `dt`,
                                            {
                                              class: `font-medium text-gray-500 dark:text-gray-400`,
                                            },
                                            `Enabled options:`,
                                            -1,
                                          )),
                                          _(`dd`, rn, [
                                            e.form.debug_mode
                                              ? (mt_1(),
                                                b(`span`, an, `Debug mode`))
                                              : y(``, true),
                                            e.form.notification_api_key_id
                                              ? (mt_1(),
                                                b(`span`, on, `Notifications`))
                                              : y(``, true),
                                            !e.form.debug_mode &&
                                            !e.form.notification_api_key_id
                                              ? (mt_1(), b(`span`, sn, `None`))
                                              : y(``, true),
                                          ]),
                                        ]),
                                      ]),
                                    ]),
                                    _: 1,
                                  },
                                ),
                              ])),
                          [`running`, `stopping`, `ended`, `error`].includes(
                            e.results.phase,
                          )
                            ? (mt_1(),
                              b(`div`, cn, [
                                _(`div`, ln, [
                                  _(`div`, un, [
                                    (n[33] ||= _(
                                      `h3`,
                                      {
                                        class: `text-sm font-semibold text-gray-900 dark:text-white`,
                                      },
                                      `Session info`,
                                      -1,
                                    )),
                                    _(`p`, dn, nr(On_1(Re)), 1),
                                    _(`div`, fn, [
                                      (mt_1(true),
                                      b(
                                        o_1,
                                        null,
                                        bt_1(On_1(ze), (e) => {
                                          mt_1();
                                          return b(
                                            `div`,
                                            {
                                              key: e.label,
                                              class: `rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-2 text-center dark:border-gray-700 dark:bg-gray-800/70`,
                                            },
                                            [
                                              _(`div`, pn, nr(e.label), 1),
                                              _(
                                                `div`,
                                                {
                                                  class: Qn([
                                                    `mt-0.5 truncate text-sm font-semibold`,
                                                    e.color,
                                                  ]),
                                                  title: String(e.value),
                                                },
                                                nr(e.value),
                                                11,
                                                mn,
                                              ),
                                            ],
                                          );
                                        }),
                                        128,
                                      )),
                                    ]),
                                  ]),
                                  _(`dl`, hn, [
                                    (mt_1(true),
                                    b(
                                      o_1,
                                      null,
                                      bt_1(On_1(Ve), (e) => {
                                        mt_1();
                                        return b(
                                          `div`,
                                          {
                                            key: e.label,
                                            class: `flex justify-between items-center`,
                                          },
                                          [
                                            _(`dt`, gn, nr(e.label) + `:`, 1),
                                            _(`dd`, _n, nr(e.value), 1),
                                          ],
                                        );
                                      }),
                                      128,
                                    )),
                                  ]),
                                ]),
                                On_1(Be).length
                                  ? (mt_1(),
                                    v_1(
                                      I,
                                      {
                                        key: 0,
                                        title: `Watch list`,
                                        flush: ``,
                                        "overflow-hidden": ``,
                                      },
                                      {
                                        default: qt_1(() => [
                                          _(`dl`, vn, [
                                            (mt_1(true),
                                            b(
                                              o_1,
                                              null,
                                              bt_1(On_1(Be), (e, t) => {
                                                mt_1();
                                                return b(
                                                  `div`,
                                                  {
                                                    key: t,
                                                    class: `flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1`,
                                                  },
                                                  [
                                                    _(
                                                      `dt`,
                                                      yn,
                                                      nr(e[0]) + `:`,
                                                      1,
                                                    ),
                                                    _(`dd`, bn, nr(e[1]), 1),
                                                  ],
                                                );
                                              }),
                                              128,
                                            )),
                                          ]),
                                        ]),
                                        _: 1,
                                      },
                                    ))
                                  : y(``, true),
                                e.results.routes.length
                                  ? (mt_1(),
                                    v_1(
                                      I,
                                      {
                                        key: 1,
                                        title: `Routes`,
                                        flush: ``,
                                        "overflow-hidden": ``,
                                        selectable: ``,
                                      },
                                      {
                                        default: qt_1(() => [
                                          _(`div`, xn, [
                                            (mt_1(true),
                                            b(
                                              o_1,
                                              null,
                                              bt_1(e.results.routes, (e, t) => {
                                                mt_1();
                                                return b(
                                                  `div`,
                                                  {
                                                    key: t,
                                                    class: `grid grid-cols-3 items-center`,
                                                  },
                                                  [
                                                    _(
                                                      `div`,
                                                      Sn,
                                                      nr(e[2].value),
                                                      1,
                                                    ),
                                                    _(
                                                      `div`,
                                                      Cn,
                                                      nr(e[0].value),
                                                      1,
                                                    ),
                                                    _(`div`, wn, [
                                                      D_1(
                                                        Oe,
                                                        {
                                                          color: `neutral`,
                                                          variant: `soft`,
                                                          size: `xs`,
                                                        },
                                                        {
                                                          default: qt_1(() => [
                                                            E_1(
                                                              nr(e[1].value),
                                                              1,
                                                            ),
                                                          ]),
                                                          _: 2,
                                                        },
                                                        1024,
                                                      ),
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
                                    ))
                                  : y(``, true),
                                D_1(
                                  I,
                                  {
                                    title:
                                      e.results.generalInfo.title ||
                                      `Session notes`,
                                    flush: ``,
                                    "overflow-hidden": ``,
                                    selectable: ``,
                                  },
                                  {
                                    header: qt_1(() => [
                                      D_1(M, {
                                        variant: `link`,
                                        color: `neutral`,
                                        icon: `i-heroicons-pencil-square`,
                                        size: `xs`,
                                        class: `shrink-0`,
                                        "aria-label": `Edit session notes`,
                                        onClick: (n[22] ||= (e) =>
                                          (U.value = true)),
                                      }),
                                    ]),
                                    default: qt_1(() => [
                                      _(`div`, Tn, [
                                        e.results.generalInfo.description
                                          ? (mt_1(),
                                            b(
                                              `div`,
                                              En,
                                              nr(
                                                e.results.generalInfo
                                                  .description,
                                              ),
                                              1,
                                            ))
                                          : (mt_1(),
                                            b(
                                              `div`,
                                              Dn,
                                              ` No notes yet. Click the edit button to add notes. `,
                                            )),
                                      ]),
                                    ]),
                                    _: 1,
                                  },
                                  8,
                                  [`title`],
                                ),
                              ]))
                            : y(``, true),
                        ]),
                        _: 1,
                      },
                    ),
                  ]),
                ])),
            D_1(
              jn,
              {
                modelValue: On_1(U),
                "onUpdate:modelValue": (n[23] ||= (e) => {
                  if (un_1(U)) {
                    return (U.value = e);
                  }
                  return null;
                }),
                "session-id": e.session,
                "initial-title": On_1(ae),
                "initial-description": On_1(G),
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
              Mn,
              {
                modelValue: On_1(W),
                "onUpdate:modelValue": (n[24] ||= (e) => {
                  if (un_1(W)) {
                    return (W.value = e);
                  }
                  return null;
                }),
                "session-id": e.session,
                form: e.form,
                "refresh-key": [
                  e.results.generalInfo.count_trades,
                  e.results.generalInfo.open_positions,
                  e.results.generalInfo.count_active_orders,
                  e.results.orders.length,
                ].join(`:`),
              },
              null,
              8,
              [`modelValue`, `session-id`, `form`, `refresh-key`],
            ),
          ],
          64,
        );
      };
    },
  }),
  {
    __name: `LiveTab`,
  },
);
const kn = {
  class: `w-full`,
};
const An = k({
  __name: `[id]`,
  setup(e) {
    r_3({
      title: `Live/Paper trading - Jesse`,
    });
    let t = r_2();
    let n = g_1(() => t.tabs);
    let i = q();
    let a = g_1(() => i.params.id);
    let c = g_1(() => n.value[a.value]);
    ct_1(async () => {
      if (!n_2(a.value)) {
        O(`error`, `Invalid live session ID`);
        await it_1(`/live/`);
        return;
      }
      if (!c.value) {
        if (t.recentlyClosedTabIds.includes(a.value)) {
          return;
        }
        if (
          !(await t.ensureTab(a.value)) &&
          Object.keys(n.value).length === 0
        ) {
          await t.addTab();
        }
      }
    });
    Ht_1(
      a,
      (e) => {
        if (!e || n.value[e] || !t.recentlyClosedTabIds.includes(e)) {
          return;
        }
        let r = Object.keys(n.value)[0];
        if (r) {
          it_1(`/live/${r}`);
          return;
        }
        t.addTab();
      },
      {
        immediate: true,
      },
    );
    Ut_1(() => {
      let c_value = c.value;
      if (!c_value) {
        return;
      }
      let t = c_value.form.routes?.[0];
      !c_value.results.selectedRoute ||
      Object.keys(c_value.results.selectedRoute).length === 0
        ? t && (c_value.results.selectedRoute = t)
        : t &&
          f(c_value.results.selectedRoute, t) &&
          (c_value.results.selectedRoute = t);
      if (c_value.form.exchange === ``) {
        c_value.form.exchange = c_value.results.generalInfo?.exchange || ``;
      }
    });
    function f(e, t) {
      if (!e || !t) {
        return false;
      }
      return (
        e.symbol === t.symbol &&
        e.timeframe === t.timeframe &&
        e.strategy === t.strategy
      );
    }
    t_23({
      w: () => {
        let e = i.params.id;
        if (e) {
          t.requestCloseOrStopTab(e);
        }
      },
      ArrowLeft: () => t.goToPrevTab(a.value),
      ArrowRight: () => t.goToNextTab(a.value),
    });
    return (e, i) => {
      let o = t_6;
      let l = On;
      mt_1();
      return b(
        o_1,
        null,
        [
          _(`div`, kn, [
            D_1(
              o,
              {
                "current-tab": c.value ? c.value.id : null,
                tabs: n.value,
                onClose: On_1(t).closeTab,
                onCancel: On_1(t).cancel,
              },
              null,
              8,
              [`current-tab`, `tabs`, `onClose`, `onCancel`],
            ),
          ]),
          c.value
            ? (mt_1(),
              v_1(
                l,
                {
                  key: 0,
                  form: c.value.form,
                  results: c.value.results,
                  session: a.value,
                  tabs: n.value,
                },
                null,
                8,
                [`form`, `results`, `session`, `tabs`],
              ))
            : y(``, true),
        ],
        64,
      );
    };
  },
});
export { An as default };
