import { r } from "./QTnfLwEv.js";
import {
  $,
  D as D_1,
  Ft,
  Ht,
  On,
  _,
  b,
  g as g_1,
  k as k_1,
  mt,
  nr,
  qt,
  v,
  vn,
  y,
} from "./CoKk4mC0.js";
import { E as E_1, r as r_2, w as w_1 } from "./B8_r5oP7.js";
import { t as t_1 } from "./DKSmMEZa2.js";
import { t as t_2 } from "./OfUAv67B2.js";
import { t as t_3 } from "./D5Z5IiLY2.js";
import { t as t_4 } from "./BvwLaU7c.js";
const C = {
  class: `w-full flex justify-between items-center`,
};
const w = {
  class: `relative flex justify-start bg-inherit z-10`,
};
const T = [`textContent`];
const E = Object.assign(
  k_1({
    __name: `Divider`,
    props: {
      title: {
        type: String,
        required: true,
      },
    },
    setup(e) {
      return (t, n) => {
        mt();
        return b(`div`, C, [
          _(`div`, w, [
            _(
              `span`,
              {
                class: `pr-3 text-lg font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap`,
                textContent: nr(e.title),
              },
              null,
              8,
              T,
            ),
          ]),
          (n[0] ||= _(
            `div`,
            {
              class: `w-full border-t-2 border-dashed border-gray-300 dark:border-gray-600`,
            },
            null,
            -1,
          )),
        ]);
      };
    },
  }),
  {
    __name: `Divider`,
  },
);
const D = r(E_1(), 1);
const O = {
  key: 0,
  class: `flex justify-center items-center py-12`,
};
const k = {
  key: 1,
};
const A = {
  key: 0,
};
const j = {
  key: 2,
  class: `text-center py-12 text-red-600 dark:text-red-400`,
};
export const t = Object.assign(
  k_1({
    __name: `ClosedTradeDetailsSlideOver`,
    props: $(
      {
        tradeId: {},
      },
      {
        modelValue: {
          type: Boolean,
          default: false,
        },
        modelModifiers: {},
      },
    ),
    emits: $([`order-click`], [`update:modelValue`]),
    setup(e, { emit }) {
      let l = Ft(e, `modelValue`);
      let g = e;
      let C = emit;
      let w = r_2();
      let T = vn(false);
      let M = vn(``);
      let N = vn(null);
      Ht(
        () => g.tradeId,
        async (e) => {
          if (e && l.value) {
            await P();
          }
        },
      );
      Ht(l, async (e) => {
        if (e && g.tradeId) {
          await P();
        }
      });
      async function P() {
        if (g.tradeId) {
          T.value = true;
          M.value = ``;
          N.value = null;
          try {
            let e = await w.fetchTradeDetails(g.tradeId);
            if (e) {
              N.value = e;
            } else {
              M.value = `Failed to load trade details`;
            }
          } catch (e) {
            M.value = e.message || `Failed to load trade details`;
          } finally {
            T.value = false;
          }
        }
      }
      let F = g_1(() => {
        if (N.value) {
          return [
            [`ID`, N.value.id],
            [`Symbol`, N.value.symbol],
            [`Exchange`, N.value.exchange],
            [`Strategy`, N.value.strategy_name],
            [`Type`, N.value.type],
            [`Timeframe`, N.value.timeframe],
            [`Leverage`, `${N.value.leverage}x`],
            [`Entry Price`, w_1.roundPrice(N.value.entry_price)],
            [
              `Exit Price`,
              N.value.exit_price ? w_1.roundPrice(N.value.exit_price) : `-`,
            ],
            [`Quantity`, N.value.qty],
            [`Size`, w_1.roundPrice(N.value.size)],
            [`Fee`, N.value.fee === null ? `-` : w_1.roundPrice(N.value.fee)],
            [
              `PNL`,
              N.value.pnl !== null && N.value.pnl_percentage !== null
                ? `${D.default.round(N.value.pnl, 2)} (${D.default.round(N.value.pnl_percentage, 2)}%)`
                : `-`,
            ],
            [`Opened At`, w_1.timestampToTime(N.value.opened_at)],
            [
              `Closed At`,
              N.value.closed_at ? w_1.timestampToTime(N.value.closed_at) : `-`,
            ],
            [
              `Holding Period`,
              N.value.holding_period === null
                ? `-`
                : `${Math.round(N.value.holding_period)}s`,
            ],
            [`Status`, N.value.status],
          ];
        }
        return [];
      });
      let I = g_1(() => {
        if (!N.value || !N.value.orders) {
          return [];
        }
        return N.value.orders.map((e) => [
          {
            value: e.id.slice(-12),
            style: `text-xs font-mono`,
            tooltip: e.id,
            tag: `code`,
          },
          {
            value: e.side,
            style: w_1.colorBasedOnSide(e.side),
          },
          {
            value: e.type,
            style: `text-xs`,
          },
          {
            value: e.price ? w_1.roundPrice(e.price) : `-`,
            style: `text-xs`,
          },
          {
            value: e.qty,
            style: `text-xs`,
          },
          {
            value: e.filled_qty,
            style: `text-xs`,
          },
          {
            value: e.status,
            style: `text-xs`,
          },
          {
            value: w_1.timestampToTimeOnly(e.created_at),
            style: `text-xs`,
            tooltip: w_1.timestampToTime(e.created_at),
          },
        ]);
      });
      function onRowClick(e) {
        if (N.value && N.value.orders && N.value.orders[e]) {
          C(`order-click`, N.value.orders[e].id);
        }
      }
      return (e, t) => {
        let r = t_3;
        let i = E;
        let c = t_4;
        let m = t_1;
        let g = t_2;
        mt();
        return v(
          g,
          {
            modelValue: l.value,
            "onUpdate:modelValue": (t[0] ||= (e) => (l.value = e)),
            size: `big`,
            title: `Trade Details`,
          },
          {
            default: qt(() => [
              On(T)
                ? (mt(),
                  b(`div`, O, [
                    ...(t[1] ||= [
                      _(
                        `div`,
                        {
                          class: `animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600`,
                        },
                        null,
                        -1,
                      ),
                    ]),
                  ]))
                : On(N)
                  ? (mt(),
                    b(`div`, k, [
                      D_1(
                        r,
                        {
                          data: On(F),
                        },
                        null,
                        8,
                        [`data`],
                      ),
                      D_1(i, {
                        class: `mt-8 mb-4`,
                        title: `Orders`,
                      }),
                      On(N).orders && On(N).orders.length
                        ? (mt(),
                          b(`div`, A, [
                            D_1(
                              c,
                              {
                                data: On(I),
                                "header-items": [
                                  `ID`,
                                  `Side`,
                                  `Type`,
                                  `Price`,
                                  `QTY`,
                                  `Filled`,
                                  `Status`,
                                  `Created`,
                                ],
                                header: ``,
                                clickable: true,
                                onRowClick,
                              },
                              null,
                              8,
                              [`data`],
                            ),
                          ]))
                        : (mt(),
                          v(m, {
                            key: 1,
                          })),
                    ]))
                  : On(M)
                    ? (mt(), b(`div`, j, nr(On(M)), 1))
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
    __name: `ClosedTradeDetailsSlideOver`,
  },
);
