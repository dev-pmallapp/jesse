import {
  $,
  Ft,
  Ht,
  On,
  Qn,
  _,
  b as b_1,
  bt,
  g,
  k as k_1,
  mt,
  nr,
  o,
  qt,
  v,
  vn,
  y,
} from "./CoKk4mC0.js";
import { r, w as w_1 } from "./B8_r5oP7.js";
import { t as t_1 } from "./OfUAv67B2.js";
const b = {
  key: 0,
  class: `flex justify-center items-center py-12`,
};
const x = {
  key: 1,
};
const S = {
  class: `flex flex-col`,
};
const C = {
  class: `-my-2 overflow-x-auto`,
};
const w = {
  class: `py-2 align-middle inline-block min-w-full`,
};
const T = {
  class: `border dark:border-gray-600 overflow-hidden sm:rounded-sm`,
};
const E = {
  class: `min-w-full divide-y divide-gray-200 dark:divide-gray-600`,
};
const D = {
  class: `px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 dark:text-gray-400`,
};
const O = [`textContent`];
const k = [`textContent`];
const A = [`textContent`];
const j = {
  key: 2,
  class: `text-center py-12 text-red-600 dark:text-red-400`,
};
export const t = Object.assign(
  k_1({
    __name: `OrderDetailsSlideOver`,
    props: $(
      {
        orderId: {},
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
      let l = Ft(e, `modelValue`);
      let M = e;
      let N = r();
      let P = vn(false);
      let F = vn(``);
      let I = vn(null);
      Ht(
        () => M.orderId,
        async (e) => {
          if (e && l.value) {
            await L();
          }
        },
      );
      Ht(l, async (e) => {
        if (e && M.orderId) {
          await L();
        }
      });
      async function L() {
        if (M.orderId) {
          P.value = true;
          F.value = ``;
          I.value = null;
          try {
            let e = await N.fetchOrderDetails(M.orderId);
            if (e) {
              I.value = e;
            } else {
              F.value = `Failed to load order details`;
            }
          } catch (e) {
            F.value = e.message || `Failed to load order details`;
          } finally {
            P.value = false;
          }
        }
      }
      let R = g(() => {
        if (I.value) {
          return [
            [
              `ID`,
              {
                value: I.value.id,
                tag: `code`,
              },
            ],
            [
              `Exchange ID`,
              {
                value: I.value.exchange_id || `-`,
                tag: I.value.exchange_id ? `code` : undefined,
              },
            ],
            [
              `Trade ID`,
              {
                value: I.value.trade_id || `-`,
                tag: I.value.trade_id ? `code` : undefined,
              },
            ],
            [
              `Symbol`,
              {
                value: I.value.symbol,
              },
            ],
            [
              `Exchange`,
              {
                value: I.value.exchange,
              },
            ],
            [
              `Side`,
              {
                value: I.value.side,
                style:
                  I.value.side === `buy`
                    ? `text-green-600 dark:text-green-400`
                    : `text-red-600 dark:text-red-400`,
              },
            ],
            [
              `Type`,
              {
                value: I.value.type,
              },
            ],
            [
              `Price`,
              {
                value: I.value.price ? w_1.roundPrice(I.value.price) : `-`,
              },
            ],
            [
              `Quantity`,
              {
                value: I.value.qty,
                style:
                  I.value.qty > 0
                    ? `text-green-600 dark:text-green-400`
                    : `text-red-600 dark:text-red-400`,
              },
            ],
            [
              `Filled Quantity`,
              {
                value: I.value.filled_qty,
              },
            ],
            [
              `Fee`,
              {
                value:
                  I.value.fee !== null && I.value.fee !== undefined
                    ? w_1.roundPrice(I.value.fee)
                    : `-`,
              },
            ],
            [
              `Status`,
              {
                value: I.value.status,
              },
            ],
            [
              `Reduce Only`,
              {
                value: I.value.reduce_only ? `Yes` : `No`,
              },
            ],
            [
              `Submitted Via`,
              {
                value: I.value.submitted_via || `-`,
              },
            ],
            [
              `Created At`,
              {
                value: w_1.timestampToTime(I.value.created_at),
              },
            ],
            [
              `Executed At`,
              {
                value: I.value.executed_at
                  ? w_1.timestampToTime(I.value.executed_at)
                  : `-`,
              },
            ],
            [
              `Canceled At`,
              {
                value: I.value.canceled_at
                  ? w_1.timestampToTime(I.value.canceled_at)
                  : `-`,
              },
            ],
          ];
        }
        return [];
      });
      return (e, t) => {
        let n = t_1;
        mt();
        return v(
          n,
          {
            modelValue: l.value,
            "onUpdate:modelValue": (t[0] ||= (e) => (l.value = e)),
            size: `big`,
            title: `Order Details`,
          },
          {
            default: qt(() => [
              On(P)
                ? (mt(),
                  b_1(`div`, b, [
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
                : On(I)
                  ? (mt(),
                    b_1(`div`, x, [
                      _(`div`, S, [
                        _(`div`, C, [
                          _(`div`, w, [
                            _(`div`, T, [
                              _(`table`, E, [
                                _(`tbody`, null, [
                                  (mt(true),
                                  b_1(
                                    o,
                                    null,
                                    bt(On(R), (e, t) => {
                                      mt();
                                      return b_1(
                                        `tr`,
                                        {
                                          key: t,
                                          class: Qn(
                                            t % 2 == 0
                                              ? `bg-white dark:bg-gray-700`
                                              : `bg-gray-50 dark:bg-backdrop-dark`,
                                          ),
                                        },
                                        [
                                          _(`td`, D, nr(e[0]), 1),
                                          _(
                                            `td`,
                                            {
                                              class: Qn([
                                                `px-6 py-4 whitespace-nowrap text-sm font-bold`,
                                                e[1].style,
                                              ]),
                                            },
                                            [
                                              e[1].tag === `code`
                                                ? (mt(),
                                                  b_1(
                                                    `code`,
                                                    {
                                                      key: 0,
                                                      class: `rounded-sm border dark:border-gray-600 bg-gray-50 dark:bg-gray-700 select-text text-sm dark:text-gray-300 px-2 py-1`,
                                                      textContent: nr(
                                                        e[1].value === 0
                                                          ? ``
                                                          : e[1].value,
                                                      ),
                                                    },
                                                    null,
                                                    8,
                                                    O,
                                                  ))
                                                : e[1].tag === `pre`
                                                  ? (mt(),
                                                    b_1(
                                                      `pre`,
                                                      {
                                                        key: 1,
                                                        class: `whitespace-pre-line rounded-sm border dark:border-gray-600 bg-gray-50 dark:bg-gray-700 select-text text-sm dark:text-gray-300 px-2 py-1`,
                                                        textContent: nr(
                                                          e[1].value === 0
                                                            ? ``
                                                            : e[1].value,
                                                        ),
                                                      },
                                                      null,
                                                      8,
                                                      k,
                                                    ))
                                                  : (mt(),
                                                    b_1(
                                                      `span`,
                                                      {
                                                        key: 2,
                                                        textContent: nr(
                                                          e[1].value === 0
                                                            ? ``
                                                            : e[1].value,
                                                        ),
                                                      },
                                                      null,
                                                      8,
                                                      A,
                                                    )),
                                            ],
                                            2,
                                          ),
                                        ],
                                        2,
                                      );
                                    }),
                                    128,
                                  )),
                                ]),
                              ]),
                            ]),
                          ]),
                        ]),
                      ]),
                    ]))
                  : On(F)
                    ? (mt(), b_1(`div`, j, nr(On(F)), 1))
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
    __name: `OrderDetailsSlideOver`,
  },
);
