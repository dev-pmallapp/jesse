import {
  B as B_1,
  D as D_1,
  E as E_1,
  On,
  Qn,
  _ as __1,
  b,
  g,
  k as k_1,
  mt,
  nr,
  o,
  qt,
  un,
  v,
  vn,
  y,
} from "./CoKk4mC0.js";
import { it } from "./Cd-sGgPF.js";
import { n } from "./2k_QeT3T.js";
import { w as w_1 } from "./B8_r5oP7.js";
import { t as t_1 } from "./CJNUlr67.js";
import { t as t_2 } from "./B4Wc4BFL2.js";
import { t as t_3 } from "./BWDSh1SW.js";
const C = {
  class: `bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-xs`,
};
const w = {
  key: 0,
  class: `flex justify-center`,
};
const ee = {
  key: 1,
  class: `flex items-center gap-2`,
};
const T = {
  class: `text-xs font-medium capitalize`,
};
const E = {
  class: `flex flex-col`,
};
const D = {
  class: `font-semibold text-gray-900 dark:text-gray-100`,
};
const O = {
  class: `text-xs text-gray-500 dark:text-gray-400`,
};
const k = {
  key: 0,
  class: `flex flex-col`,
};
const A = {
  class: `text-sm font-medium text-gray-900 dark:text-gray-100`,
};
const j = {
  class: `text-xs text-gray-500 dark:text-gray-400`,
};
const M = {
  key: 1,
  class: `text-sm text-gray-700 dark:text-gray-300`,
};
const N = {
  class: `flex justify-center`,
};
const P = {
  class: `text-sm text-gray-500 dark:text-gray-400`,
};
const F = {
  key: 0,
  class: `flex flex-col items-center`,
};
const I = {
  key: 1,
  class: `flex justify-center`,
};
const L = {
  key: 0,
  class: `flex flex-col items-center text-sm`,
};
const R = {
  class: `text-gray-900 dark:text-gray-100 font-medium`,
};
const z = {
  key: 1,
  class: `flex justify-center`,
};
const B = {
  class: `flex justify-center`,
};
const V = {
  class: `text-sm font-medium`,
};
const H = {
  class: `flex justify-center`,
};
const U = {
  key: 1,
  class: `text-gray-400`,
};
const W = {
  class: `flex items-center justify-end gap-1`,
};
export const t = Object.assign(
  k_1({
    __name: `LiveSessionsTable`,
    props: {
      sessions: {},
      showHistoryActions: {
        type: Boolean,
      },
    },
    emits: [`start`, `stop`, `close`, `delete`, `notes`, `load`],
    setup(c) {
      let G = c;
      let K = t_1;
      let q = vn([
        {
          id: `pnl_perc`,
          desc: true,
        },
      ]);
      function J(label) {
        return ({ column }) =>
          B_1(t_1, {
            color: `neutral`,
            variant: `ghost`,
            label,
            icon: column.getIsSorted()
              ? column.getIsSorted() === `asc`
                ? `i-heroicons-bars-arrow-up`
                : `i-heroicons-bars-arrow-down`
              : `i-heroicons-arrows-up-down`,
            onClick: () => column.toggleSorting(column.getIsSorted() === `asc`),
          });
      }
      let Y = g(() => {
        if (G.showHistoryActions) {
          return [
            {
              accessorKey: `strategy`,
              header: `Strategy`,
            },
            {
              id: `session`,
              header: `Session`,
            },
            {
              accessorKey: `mode`,
              header: `Mode`,
              meta: {
                class: {
                  th: `text-center`,
                  td: `text-center`,
                },
              },
            },
            {
              accessorKey: `status`,
              header: `Status`,
              meta: {
                class: {
                  th: `text-center`,
                  td: `text-center`,
                },
              },
            },
            {
              accessorKey: `updated_at`,
              header: `Date`,
            },
            {
              id: `actions`,
              header: ``,
              meta: {
                class: {
                  th: `w-32 text-right`,
                  td: `w-32 text-right`,
                },
              },
            },
          ];
        }
        return [
          {
            accessorKey: `status`,
            header: `Status`,
          },
          {
            id: `session`,
            header: `Session`,
          },
          {
            accessorKey: `strategy`,
            header: `Strategy`,
          },
          {
            accessorKey: `pnl_perc`,
            header: J(`PNL`),
            meta: {
              class: {
                th: `text-center`,
                td: `text-center`,
              },
            },
          },
          {
            id: `balance`,
            header: `Balance`,
            meta: {
              class: {
                th: `text-center`,
                td: `text-center`,
              },
            },
          },
          {
            accessorKey: `count_trades`,
            header: J(`Trades`),
            meta: {
              class: {
                th: `text-center`,
                td: `text-center`,
              },
            },
          },
          {
            accessorKey: `open_positions`,
            header: J(`Pos`),
            meta: {
              class: {
                th: `text-center`,
                td: `text-center`,
              },
            },
          },
          {
            id: `actions`,
            header: ``,
            meta: {
              class: {
                th: `w-24 text-right`,
                td: `w-24 text-right`,
              },
            },
          },
        ];
      });
      function X(e, t = 0) {
        let n = typeof e == `number` ? e : Number(e);
        if (Number.isFinite(n)) {
          return n;
        }
        return t;
      }
      let Z = g(() => {
        if (G.showHistoryActions) {
          return G.sessions.map((e) => {
            let t = e.state?.form?.routes?.[0] || {};
            return {
              id: e.id,
              title: e.title,
              strategy: t.strategy,
              exchange: e.exchange,
              symbol: t.symbol,
              timeframe: t.timeframe,
              mode: e.session_mode,
              status: e.status,
              updated_at: w_1.timestampToReadableDateTime(e.updated_at),
              rawSession: e,
              phase: `ended`,
              pnl: 0,
              pnl_perc: 0,
              count_trades: 0,
              open_positions: 0,
              hasPnl: false,
            };
          });
        }
        return G.sessions.map((e) => {
          let t = e.results.generalInfo || {};
          let n = e.form.routes[0] || {};
          return {
            id: e.id,
            phase: e.results.phase,
            exchange: e.form.exchange,
            symbol: n.symbol,
            timeframe: n.timeframe,
            strategy: n.strategy,
            status: e.results.phase,
            pnl: X(t.pnl),
            pnl_perc: X(t.pnl_perc),
            current_balance: t.current_balance,
            started_balance: t.started_balance,
            count_trades: X(t.count_trades),
            open_positions: X(t.open_positions),
            hasPnl: t.pnl !== undefined && t.pnl !== null,
          };
        });
      });
      function Q(e) {
        if (e === `running`) {
          return `bg-green-500`;
        }
        if (e === `starting`) {
          return `bg-yellow-500`;
        }
        if (e === `editing`) {
          return `bg-gray-400`;
        }
        if (e === `error`) {
          return `bg-red-500`;
        }
        if (e === `ended`) {
          return `bg-blue-500`;
        }
        if (e === `stopping`) {
          return `bg-orange-500`;
        }
        return `bg-gray-400`;
      }
      function $(e) {
        let t = Number(e);
        if (t === 0 || isNaN(t)) {
          return `text-gray-900 dark:text-gray-100`;
        }
        if (t > 0) {
          return `text-green-600 dark:text-green-400`;
        }
        return `text-red-600 dark:text-red-400`;
      }
      function te(e) {
        switch (e?.toLowerCase()) {
          case `running`:
            return `info`;
          case `stopped`:
            return `error`;
          case `terminated`:
            return `neutral`;
          default:
            return `neutral`;
        }
      }
      function ne(e) {
        it(`/live/${e}`);
      }
      return (e, s) => {
        let c = t_2;
        let h = n;
        let _ = t_3;
        mt();
        return b(`div`, C, [
          D_1(
            _,
            {
              sorting: On(q),
              "onUpdate:sorting": (s[0] ||= (e) => {
                if (un(q)) {
                  return (q.value = e);
                }
                return null;
              }),
              data: On(Z),
              columns: On(Y),
              class: `w-full`,
              ui: {
                td: `whitespace-nowrap`,
                th: `whitespace-nowrap`,
              },
            },
            {
              "status-cell": qt(({ row }) => [
                G.showHistoryActions
                  ? (mt(),
                    b(`div`, w, [
                      D_1(
                        c,
                        {
                          color: te(row.original.status),
                          label: row.original.status,
                          variant: `soft`,
                          size: `xs`,
                        },
                        null,
                        8,
                        [`color`, `label`],
                      ),
                    ]))
                  : (mt(),
                    b(`div`, ee, [
                      __1(
                        `div`,
                        {
                          class: Qn([
                            `w-2.5 h-2.5 rounded-full`,
                            Q(row.original.phase),
                          ]),
                        },
                        null,
                        2,
                      ),
                      __1(`span`, T, nr(row.original.phase), 1),
                    ])),
              ]),
              "session-cell": qt(({ row }) => [
                __1(`div`, E, [
                  __1(`span`, D, nr(row.original.exchange || `-`), 1),
                  __1(
                    `span`,
                    O,
                    nr(row.original.symbol) +
                      ` • ` +
                      nr(row.original.timeframe),
                    1,
                  ),
                ]),
              ]),
              "strategy-cell": qt(({ row }) => [
                G.showHistoryActions
                  ? (mt(),
                    b(`div`, k, [
                      __1(
                        `span`,
                        A,
                        nr(
                          row.original.title ||
                            row.original.strategy ||
                            `Unknown Strategy`,
                        ),
                        1,
                      ),
                      __1(
                        `span`,
                        j,
                        nr(row.original.exchange || `Unknown Exchange`),
                        1,
                      ),
                    ]))
                  : (mt(), b(`span`, M, nr(row.original.strategy), 1)),
              ]),
              "mode-cell": qt(({ row }) => [
                __1(`div`, N, [
                  D_1(
                    c,
                    {
                      color:
                        row.original.mode === `livetrade` ? `error` : `warning`,
                      label:
                        row.original.mode === `livetrade` ? `Live` : `Paper`,
                      variant: `soft`,
                      size: `xs`,
                    },
                    null,
                    8,
                    [`color`, `label`],
                  ),
                ]),
              ]),
              "updated_at-cell": qt(({ row }) => [
                __1(`span`, P, nr(row.original.updated_at), 1),
              ]),
              "pnl_perc-cell": qt(({ row }) => [
                row.original.phase === `running` || row.original.hasPnl
                  ? (mt(),
                    b(`div`, F, [
                      __1(
                        `span`,
                        {
                          class: Qn([`font-bold`, $(row.original.pnl)]),
                        },
                        nr(row.original.pnl),
                        3,
                      ),
                      __1(
                        `span`,
                        {
                          class: Qn([`text-xs`, $(row.original.pnl)]),
                        },
                        ` (` + nr(row.original.pnl_perc) + `%) `,
                        3,
                      ),
                    ]))
                  : (mt(),
                    b(`div`, I, [
                      ...(s[1] ||= [
                        __1(
                          `span`,
                          {
                            class: `text-gray-400`,
                          },
                          `-`,
                          -1,
                        ),
                      ]),
                    ])),
              ]),
              "balance-cell": qt(({ row }) => [
                row.original.current_balance
                  ? (mt(),
                    b(`div`, L, [
                      __1(`span`, R, nr(row.original.current_balance), 1),
                    ]))
                  : (mt(),
                    b(`div`, z, [
                      ...(s[2] ||= [
                        __1(
                          `span`,
                          {
                            class: `text-gray-400`,
                          },
                          `-`,
                          -1,
                        ),
                      ]),
                    ])),
              ]),
              "count_trades-cell": qt(({ row }) => [
                __1(`div`, B, [
                  __1(`span`, V, nr(row.original.count_trades ?? 0), 1),
                ]),
              ]),
              "open_positions-cell": qt(({ row }) => [
                __1(`div`, H, [
                  row.original.open_positions > 0
                    ? (mt(),
                      v(
                        c,
                        {
                          key: 0,
                          size: `xs`,
                          color: `neutral`,
                          variant: `solid`,
                        },
                        {
                          default: qt(() => [
                            E_1(nr(row.original.open_positions), 1),
                          ]),
                          _: 2,
                        },
                        1024,
                      ))
                    : (mt(), b(`span`, U, `0`)),
                ]),
              ]),
              "actions-cell": qt(({ row }) => [
                __1(`div`, W, [
                  G.showHistoryActions
                    ? (mt(),
                      b(
                        o,
                        {
                          key: 0,
                        },
                        [
                          D_1(
                            h,
                            {
                              text: `Add Note`,
                            },
                            {
                              default: qt(() => [
                                D_1(
                                  On(K),
                                  {
                                    size: `xs`,
                                    variant: `ghost`,
                                    color: `neutral`,
                                    icon: `i-heroicons-pencil-square`,
                                    "aria-label": `Add note`,
                                    onClick: (t) =>
                                      e.$emit(`notes`, row.original),
                                  },
                                  null,
                                  8,
                                  [`onClick`],
                                ),
                              ]),
                              _: 2,
                            },
                            1024,
                          ),
                          D_1(
                            h,
                            {
                              text: `Load Session`,
                            },
                            {
                              default: qt(() => [
                                D_1(
                                  On(K),
                                  {
                                    size: `xs`,
                                    variant: `ghost`,
                                    color: `neutral`,
                                    icon: `i-heroicons-arrow-right`,
                                    "aria-label": `Load session`,
                                    onClick: (t) =>
                                      e.$emit(`load`, row.original.id),
                                  },
                                  null,
                                  8,
                                  [`onClick`],
                                ),
                              ]),
                              _: 2,
                            },
                            1024,
                          ),
                          row.original.status === `running`
                            ? y(``, true)
                            : (mt(),
                              v(
                                h,
                                {
                                  key: 0,
                                  text: `Delete`,
                                },
                                {
                                  default: qt(() => [
                                    D_1(
                                      On(K),
                                      {
                                        size: `xs`,
                                        variant: `ghost`,
                                        color: `error`,
                                        icon: `i-heroicons-trash`,
                                        "aria-label": `Delete session`,
                                        onClick: (t) =>
                                          e.$emit(`delete`, row.original.id),
                                      },
                                      null,
                                      8,
                                      [`onClick`],
                                    ),
                                  ]),
                                  _: 2,
                                },
                                1024,
                              )),
                        ],
                        64,
                      ))
                    : (mt(),
                      b(
                        o,
                        {
                          key: 1,
                        },
                        [
                          D_1(
                            h,
                            {
                              text: `View Session`,
                            },
                            {
                              default: qt(() => [
                                D_1(
                                  On(K),
                                  {
                                    size: `xs`,
                                    variant: `ghost`,
                                    color: `neutral`,
                                    icon: `i-heroicons-eye`,
                                    "aria-label": `View session`,
                                    onClick: (e) => ne(row.original.id),
                                  },
                                  null,
                                  8,
                                  [`onClick`],
                                ),
                              ]),
                              _: 2,
                            },
                            1024,
                          ),
                          [`editing`, `ended`, `error`].includes(
                            row.original.phase,
                          )
                            ? (mt(),
                              v(
                                h,
                                {
                                  key: 0,
                                  text: `Start Session`,
                                },
                                {
                                  default: qt(() => [
                                    D_1(
                                      On(K),
                                      {
                                        size: `xs`,
                                        variant: `ghost`,
                                        icon: `i-heroicons-play`,
                                        "aria-label": `Start session`,
                                        onClick: (t) =>
                                          e.$emit(`start`, row.original.id),
                                      },
                                      null,
                                      8,
                                      [`onClick`],
                                    ),
                                  ]),
                                  _: 2,
                                },
                                1024,
                              ))
                            : y(``, true),
                          [`starting`, `running`].includes(row.original.phase)
                            ? (mt(),
                              v(
                                h,
                                {
                                  key: 1,
                                  text: `Stop Session`,
                                },
                                {
                                  default: qt(() => [
                                    D_1(
                                      On(K),
                                      {
                                        size: `xs`,
                                        variant: `ghost`,
                                        color: `error`,
                                        icon: `i-heroicons-stop`,
                                        "aria-label": `Stop session`,
                                        onClick: (t) =>
                                          e.$emit(`stop`, row.original.id),
                                      },
                                      null,
                                      8,
                                      [`onClick`],
                                    ),
                                  ]),
                                  _: 2,
                                },
                                1024,
                              ))
                            : y(``, true),
                          [`editing`, `ended`, `error`].includes(
                            row.original.phase,
                          )
                            ? (mt(),
                              v(
                                h,
                                {
                                  key: 2,
                                  text: `Close Tab`,
                                },
                                {
                                  default: qt(() => [
                                    D_1(
                                      On(K),
                                      {
                                        size: `xs`,
                                        variant: `ghost`,
                                        color: `error`,
                                        icon: `i-heroicons-x-mark`,
                                        "aria-label": `Close tab`,
                                        onClick: (t) =>
                                          e.$emit(`close`, row.original.id),
                                      },
                                      null,
                                      8,
                                      [`onClick`],
                                    ),
                                  ]),
                                  _: 2,
                                },
                                1024,
                              ))
                            : y(``, true),
                        ],
                        64,
                      )),
                ]),
              ]),
              _: 1,
            },
            8,
            [`sorting`, `data`, `columns`],
          ),
        ]);
      };
    },
  }),
  {
    __name: `LiveSessionsTable`,
  },
);
