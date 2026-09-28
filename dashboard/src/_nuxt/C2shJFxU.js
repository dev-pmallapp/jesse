import { s } from "./DytYwiiF.js";
import {
  B,
  D as D_1,
  E as E_1,
  Ht,
  On,
  Qn,
  Yt,
  _,
  b as b_1,
  bt,
  g as g_1,
  gn,
  k,
  mt,
  nr,
  o,
  qt,
  un,
  v as v_1,
  vn,
  y,
} from "./CoKk4mC0.js";
import { qt as qt_1 } from "./Cd-sGgPF.js";
import { n, t as t_1 } from "./2k_QeT3T.js";
import { O as O_1, S as S_1, b as b_2, t as t_2, x } from "./B8_r5oP7.js";
import { r } from "./BpBaBBm3.js";
import { t as t_3 } from "./atteXEGs.js";
import { t as t_4 } from "./OaeI3Ulg.js";
import { t as t_5 } from "./Cf85K_3V.js";
import { t as t_6 } from "./pQUz-uq3.js";
import { i as i_1, t as t_7 } from "./CJNUlr67.js";
import { t as t_8 } from "./DQUlB_uC.js";
import { t as t_9 } from "./BG8CfSEZ2.js";
import { t as t_10 } from "./JgXkd7uo2.js";
import { t as t_11 } from "./DEJw_qiA2.js";
import { t as t_12 } from "./B4Wc4BFL2.js";
import { t as t_13 } from "./D1yN6wZY2.js";
import { t as t_14 } from "./uf1cV9ZP.js";
import { t as t_15 } from "./BWDSh1SW.js";
const ie = {
  class: `flex items-start gap-3`,
};
const V = {
  class: `rounded-lg bg-primary/10 p-2 text-primary`,
};
const ae = {
  class: `space-y-5`,
};
const H = {
  class: `grid grid-cols-1 gap-3 sm:grid-cols-2`,
};
const U = {
  for: `custom-candle-csv`,
  class: `flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-gray-300 px-4 py-4 transition hover:border-primary dark:border-gray-700`,
};
const oe = {
  class: `min-w-0`,
};
const se = {
  class: `block truncate text-sm font-medium text-gray-800 dark:text-gray-200`,
};
const W = {
  class: `rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-700`,
};
const G = {
  class: `mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2`,
};
const K = {
  key: 1,
  class: `space-y-3 rounded-xl border border-gray-200 p-4 dark:border-gray-700`,
};
const q = {
  class: `flex flex-wrap items-center justify-between gap-2`,
};
const J = {
  class: `flex items-center gap-2`,
};
const Y = {
  class: `font-medium text-gray-900 dark:text-white`,
};
const ce = {
  class: `grid grid-cols-1 gap-3 text-sm sm:grid-cols-3`,
};
const le = {
  class: `mt-0.5 font-medium text-gray-800 dark:text-gray-200`,
};
const ue = {
  class: `mt-0.5 font-medium text-gray-800 dark:text-gray-200`,
};
const de = {
  class: `mt-0.5 font-medium text-gray-800 dark:text-gray-200`,
};
const fe = {
  key: 0,
  class: `grid grid-cols-2 gap-2 text-xs sm:grid-cols-4`,
};
const pe = {
  class: `rounded-md bg-gray-50 p-2 dark:bg-gray-800`,
};
const me = {
  class: `mt-0.5 font-semibold`,
};
const he = {
  class: `rounded-md bg-gray-50 p-2 dark:bg-gray-800`,
};
const ge = {
  class: `mt-0.5 font-semibold`,
};
const X = {
  class: `rounded-md bg-gray-50 p-2 dark:bg-gray-800`,
};
const _e = {
  class: `mt-0.5 font-semibold`,
};
const ve = {
  class: `rounded-md bg-gray-50 p-2 dark:bg-gray-800`,
};
const ye = {
  class: `mt-0.5 font-semibold`,
};
const be = {
  key: 1,
  class: `space-y-1 text-sm text-error`,
};
const xe = {
  class: `flex flex-col-reverse gap-2 sm:flex-row sm:justify-end`,
};
const Z = Object.assign(
  k({
    __name: `CustomCandleImportModal`,
    emits: [`imported`],
    setup(e, { emit }) {
      let s = emit;
      let p = vn(false);
      let S = vn(null);
      let C = vn(null);
      let D = vn(``);
      let O = vn(`auto`);
      let A = vn(null);
      let j = vn(false);
      let M = vn(false);
      let I = vn(``);
      let ne = [
        {
          label: `Detect automatically`,
          value: `auto`,
        },
        {
          label: `Unix milliseconds`,
          value: `unix_ms`,
        },
        {
          label: `Unix seconds`,
          value: `unix_s`,
        },
        {
          label: `ISO-8601 with timezone`,
          value: `iso8601`,
        },
      ];
      let L = [`timestamp`, `open`, `close`, `high`, `low`, `volume`];
      let B = gn({
        timestamp: `timestamp`,
        open: `open`,
        high: `high`,
        low: `low`,
        close: `close`,
        volume: `volume`,
      });
      let Z = g_1(
        () => !!(C.value && D.value.trim() && L.every((e) => B[e].trim())),
      );
      Ht([D, O, B], () => {
        A.value = null;
        I.value = ``;
      });
      function onChange(e) {
        C.value = e.target.files?.[0] ?? null;
        A.value = null;
        I.value = ``;
      }
      function Q() {
        let e = new FormData();
        e.append(`file`, C.value);
        e.append(`symbol`, D.value.trim());
        e.append(`timestamp_format`, O.value);
        for (let t of L) {
          e.append(`${t}_column`, B[t].trim());
        }
        return e;
      }
      async function Ce() {
        if (!Z.value) {
          return;
        }
        j.value = true;
        I.value = ``;
        let { data, error } = await S_1(`/candles/custom/preview`, {
          method: `POST`,
          body: Q(),
          authenticated: true,
        });
        j.value = false;
        if (error.value) {
          I.value = x(error.value, `Could not preview this CSV.`);
          return;
        }
        A.value = data.value?.data ?? null;
      }
      async function we() {
        if (!A.value?.valid || !C.value) {
          return;
        }
        M.value = true;
        I.value = ``;
        let { error } = await S_1(`/candles/custom/import`, {
          method: `POST`,
          body: Q(),
          authenticated: true,
        });
        M.value = false;
        if (error.value) {
          I.value = x(error.value, `Could not import this CSV.`);
          return;
        }
        O_1(
          `success`,
          `${A.value.row_count.toLocaleString()} observed rows were processed for ${A.value.symbol}.`,
        );
        s(`imported`);
        p.value = false;
      }
      function $(e) {
        if (e === null) {
          return `Not available`;
        }
        return `${new Date(e).toLocaleString(undefined, {
          timeZone: `UTC`,
        })} UTC`;
      }
      function Te() {
        C.value = null;
        if (S.value) {
          S.value.value = ``;
        }
        D.value = ``;
        O.value = `auto`;
        for (let e of L) {
          B[e] = e;
        }
        A.value = null;
        I.value = ``;
        j.value = false;
        M.value = false;
      }
      return (e, t) => {
        let i = t_7;
        let s = i_1;
        let d = t_1;
        let f = t_9;
        let b = t_6;
        let T = t_14;
        let E = t_12;
        let k = t_13;
        let Q = t_4;
        mt();
        return b_1(
          o,
          null,
          [
            D_1(i, {
              icon: `i-heroicons-document-arrow-up`,
              color: `neutral`,
              variant: `outline`,
              label: `Import CSV`,
              onClick: (t[0] ||= (e) => (p.value = true)),
            }),
            D_1(
              Q,
              {
                open: On(p),
                "onUpdate:open": (t[4] ||= (e) => {
                  if (un(p)) {
                    return (p.value = e);
                  }
                  return null;
                }),
                ui: {
                  content: `sm:max-w-2xl`,
                },
                "onAfter:leave": Te,
              },
              {
                content: qt(() => [
                  D_1(
                    k,
                    {
                      ui: {
                        root: `flex max-h-[calc(100dvh-2rem)] flex-col overflow-hidden`,
                        header: `shrink-0`,
                        body: `min-h-0 flex-1 overflow-y-auto`,
                        footer: `shrink-0`,
                      },
                    },
                    {
                      header: qt(() => [
                        _(`div`, ie, [
                          _(`div`, V, [
                            D_1(s, {
                              name: `i-heroicons-table-cells`,
                              class: `size-5`,
                            }),
                          ]),
                          (t[5] ||= _(
                            `div`,
                            null,
                            [
                              _(
                                `h2`,
                                {
                                  class: `font-semibold text-gray-900 dark:text-white`,
                                },
                                `Import custom candles`,
                              ),
                              _(
                                `p`,
                                {
                                  class: `mt-0.5 text-sm text-gray-500 dark:text-gray-400`,
                                },
                                ` Preview a UTF-8, one-minute candle CSV before storing it as Custom Data. `,
                              ),
                            ],
                            -1,
                          )),
                        ]),
                      ]),
                      footer: qt(() => [
                        _(`div`, xe, [
                          D_1(i, {
                            color: `neutral`,
                            variant: `ghost`,
                            label: `Cancel`,
                            class: `justify-center`,
                            onClick: (t[3] ||= (e) => (p.value = false)),
                          }),
                          On(A)?.valid
                            ? (mt(),
                              v_1(
                                i,
                                {
                                  key: 1,
                                  icon: `i-heroicons-arrow-up-tray`,
                                  label: `Confirm import`,
                                  class: `justify-center`,
                                  loading: On(M),
                                  onClick: we,
                                },
                                null,
                                8,
                                [`loading`],
                              ))
                            : (mt(),
                              v_1(
                                i,
                                {
                                  key: 0,
                                  icon: `i-heroicons-magnifying-glass`,
                                  label: `Preview CSV`,
                                  class: `justify-center`,
                                  loading: On(j),
                                  disabled: !On(Z),
                                  onClick: Ce,
                                },
                                null,
                                8,
                                [`loading`, `disabled`],
                              )),
                        ]),
                      ]),
                      default: qt(() => [
                        _(`div`, ae, [
                          _(`div`, H, [
                            D_1(
                              f,
                              {
                                label: `Symbol`,
                                required: ``,
                                help: `Jesse pair syntax, for example SPY-USD`,
                              },
                              {
                                default: qt(() => [
                                  D_1(
                                    d,
                                    {
                                      modelValue: On(D),
                                      "onUpdate:modelValue": (t[1] ||= (e) => {
                                        if (un(D)) {
                                          return (D.value = e);
                                        }
                                        return null;
                                      }),
                                      class: `w-full`,
                                      placeholder: `SPY-USD`,
                                      autocomplete: `off`,
                                      "aria-label": `Custom data symbol`,
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
                                label: `Timestamp format`,
                                required: ``,
                              },
                              {
                                default: qt(() => [
                                  D_1(
                                    b,
                                    {
                                      modelValue: On(O),
                                      "onUpdate:modelValue": (t[2] ||= (e) => {
                                        if (un(O)) {
                                          return (O.value = e);
                                        }
                                        return null;
                                      }),
                                      class: `w-full`,
                                      items: ne,
                                      "value-key": `value`,
                                      "label-key": `label`,
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
                          D_1(T, {
                            color: `warning`,
                            variant: `soft`,
                            icon: `i-heroicons-clock`,
                            title: `One-minute candles only`,
                            description: `Each CSV row must represent one complete 1m candle, with its timestamp aligned to a one-minute UTC boundary. Other timeframes are not supported yet.`,
                          }),
                          (t[15] ||= _(
                            `div`,
                            {
                              class: `rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/60`,
                            },
                            [
                              _(
                                `p`,
                                {
                                  class: `text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400`,
                                },
                                `Required columns`,
                              ),
                              _(
                                `code`,
                                {
                                  class: `mt-1.5 block break-all text-sm text-gray-700 dark:text-gray-200`,
                                },
                                `timestamp,open,close,high,low,volume`,
                              ),
                              _(
                                `p`,
                                {
                                  class: `mt-2 text-xs leading-5 text-gray-500 dark:text-gray-400`,
                                },
                                ` Rows must be strictly ascending and unique. Missing minutes are preserved as gaps. `,
                              ),
                            ],
                            -1,
                          )),
                          _(`div`, null, [
                            _(
                              `input`,
                              {
                                id: `custom-candle-csv`,
                                ref_key: `fileInput`,
                                ref: S,
                                type: `file`,
                                accept: `.csv,text/csv`,
                                class: `sr-only`,
                                onChange,
                              },
                              null,
                              544,
                            ),
                            _(`label`, U, [
                              D_1(s, {
                                name: `i-heroicons-document-text`,
                                class: `size-8 shrink-0 text-gray-400`,
                              }),
                              _(`span`, oe, [
                                _(
                                  `span`,
                                  se,
                                  nr(On(C)?.name || `Choose a CSV file`),
                                  1,
                                ),
                                (t[6] ||= _(
                                  `span`,
                                  {
                                    class: `mt-0.5 block text-xs text-gray-500 dark:text-gray-400`,
                                  },
                                  ` The file is validated in full before anything is stored. `,
                                  -1,
                                )),
                              ]),
                            ]),
                          ]),
                          _(`details`, W, [
                            (t[7] ||= _(
                              `summary`,
                              {
                                class: `cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-200`,
                              },
                              `Column mapping`,
                              -1,
                            )),
                            _(`div`, G, [
                              (mt(),
                              b_1(
                                o,
                                null,
                                bt(L, (e) =>
                                  D_1(
                                    f,
                                    {
                                      key: e,
                                      label: e,
                                    },
                                    {
                                      default: qt(() => [
                                        D_1(
                                          d,
                                          {
                                            modelValue: On(B)[e],
                                            "onUpdate:modelValue": (t) =>
                                              (On(B)[e] = t),
                                            class: `w-full`,
                                            placeholder: e,
                                            "aria-label": `${e} CSV column`,
                                          },
                                          null,
                                          8,
                                          [
                                            `modelValue`,
                                            `onUpdate:modelValue`,
                                            `placeholder`,
                                            `aria-label`,
                                          ],
                                        ),
                                      ]),
                                      _: 2,
                                    },
                                    1032,
                                    [`label`],
                                  ),
                                ),
                                64,
                              )),
                            ]),
                          ]),
                          On(I)
                            ? (mt(),
                              v_1(
                                T,
                                {
                                  key: 0,
                                  color: `error`,
                                  variant: `soft`,
                                  icon: `i-heroicons-exclamation-triangle`,
                                  title: On(I),
                                },
                                null,
                                8,
                                [`title`],
                              ))
                            : y(``, true),
                          On(A)
                            ? (mt(),
                              b_1(`div`, K, [
                                _(`div`, q, [
                                  _(`div`, J, [
                                    D_1(
                                      s,
                                      {
                                        name: On(A).valid
                                          ? `i-heroicons-check-circle`
                                          : `i-heroicons-exclamation-circle`,
                                        class: Qn([
                                          On(A).valid
                                            ? `text-success`
                                            : `text-error`,
                                          `size-5`,
                                        ]),
                                      },
                                      null,
                                      8,
                                      [`name`, `class`],
                                    ),
                                    _(
                                      `p`,
                                      Y,
                                      nr(
                                        On(A).valid
                                          ? `Ready to import`
                                          : `CSV needs attention`,
                                      ),
                                      1,
                                    ),
                                  ]),
                                  D_1(
                                    E,
                                    {
                                      color: On(A).valid ? `success` : `error`,
                                      variant: `soft`,
                                    },
                                    {
                                      default: qt(() => [
                                        E_1(
                                          nr(On(A).row_count.toLocaleString()) +
                                            ` rows `,
                                          1,
                                        ),
                                      ]),
                                      _: 1,
                                    },
                                    8,
                                    [`color`],
                                  ),
                                ]),
                                _(`dl`, ce, [
                                  _(`div`, null, [
                                    (t[8] ||= _(
                                      `dt`,
                                      {
                                        class: `text-xs text-gray-500 dark:text-gray-400`,
                                      },
                                      `First candle`,
                                      -1,
                                    )),
                                    _(
                                      `dd`,
                                      le,
                                      nr($(On(A).first_timestamp)),
                                      1,
                                    ),
                                  ]),
                                  _(`div`, null, [
                                    (t[9] ||= _(
                                      `dt`,
                                      {
                                        class: `text-xs text-gray-500 dark:text-gray-400`,
                                      },
                                      `Last candle`,
                                      -1,
                                    )),
                                    _(`dd`, ue, nr($(On(A).last_timestamp)), 1),
                                  ]),
                                  _(`div`, null, [
                                    (t[10] ||= _(
                                      `dt`,
                                      {
                                        class: `text-xs text-gray-500 dark:text-gray-400`,
                                      },
                                      `Missing minutes`,
                                      -1,
                                    )),
                                    _(
                                      `dd`,
                                      de,
                                      nr(
                                        On(A).missing_minutes.toLocaleString(),
                                      ),
                                      1,
                                    ),
                                  ]),
                                ]),
                                On(A).valid
                                  ? y(``, true)
                                  : (mt(),
                                    b_1(`dl`, fe, [
                                      _(`div`, pe, [
                                        (t[11] ||= _(
                                          `dt`,
                                          {
                                            class: `text-gray-500 dark:text-gray-400`,
                                          },
                                          `Duplicates`,
                                          -1,
                                        )),
                                        _(
                                          `dd`,
                                          me,
                                          nr(On(A).duplicate_count),
                                          1,
                                        ),
                                      ]),
                                      _(`div`, he, [
                                        (t[12] ||= _(
                                          `dt`,
                                          {
                                            class: `text-gray-500 dark:text-gray-400`,
                                          },
                                          `Out of order`,
                                          -1,
                                        )),
                                        _(
                                          `dd`,
                                          ge,
                                          nr(On(A).ordering_failure_count),
                                          1,
                                        ),
                                      ]),
                                      _(`div`, X, [
                                        (t[13] ||= _(
                                          `dt`,
                                          {
                                            class: `text-gray-500 dark:text-gray-400`,
                                          },
                                          `Timestamps`,
                                          -1,
                                        )),
                                        _(
                                          `dd`,
                                          _e,
                                          nr(On(A).timestamp_failure_count),
                                          1,
                                        ),
                                      ]),
                                      _(`div`, ve, [
                                        (t[14] ||= _(
                                          `dt`,
                                          {
                                            class: `text-gray-500 dark:text-gray-400`,
                                          },
                                          `OHLCV`,
                                          -1,
                                        )),
                                        _(
                                          `dd`,
                                          ye,
                                          nr(On(A).ohlcv_failure_count),
                                          1,
                                        ),
                                      ]),
                                    ])),
                                On(A).errors.length
                                  ? (mt(),
                                    b_1(`ul`, be, [
                                      (mt(true),
                                      b_1(
                                        o,
                                        null,
                                        bt(On(A).errors, (e) => {
                                          mt();
                                          return b_1(
                                            `li`,
                                            {
                                              key: e,
                                            },
                                            nr(e),
                                            1,
                                          );
                                        }),
                                        128,
                                      )),
                                    ]))
                                  : y(``, true),
                              ]))
                            : y(``, true),
                        ]),
                      ]),
                      _: 1,
                    },
                  ),
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
  {
    __name: `CustomCandleImportModal`,
  },
);
const Se = {
  class: `overflow-x-auto`,
};
const Q = {
  class: `flex flex-col items-center justify-center py-12 gap-4`,
};
const Ce = {
  key: 0,
};
const we = {
  class: `flex flex-col items-center gap-2`,
};
const $ = {
  key: 1,
};
const Te = {
  class: `text-sm text-gray-900 dark:text-gray-100 font-medium`,
};
const Ee = {
  class: `text-sm text-gray-700 dark:text-gray-300`,
};
const De = {
  class: `text-sm text-gray-500 dark:text-gray-400`,
};
const Oe = {
  class: `text-sm text-gray-500 dark:text-gray-400`,
};
const ke = {
  class: `flex items-center justify-end gap-1`,
};
const Ae = Object.assign(
  k({
    __name: `CandlesTable`,
    props: {
      candles: {},
      loading: {
        type: Boolean,
      },
    },
    emits: [`refresh`, `update`, `export`, `copy`, `delete`],
    setup(e) {
      let r = t_7;
      let i = e;
      let o = vn([
        {
          id: `exchange`,
          desc: false,
        },
      ]);
      function s(label) {
        return ({ column }) =>
          B(t_7, {
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
      let columns = [
        {
          accessorKey: `exchange`,
          header: s(`Exchange`),
        },
        {
          accessorKey: `symbol`,
          header: s(`Symbol`),
        },
        {
          accessorKey: `start_date`,
          header: `Start Date`,
        },
        {
          accessorKey: `end_date`,
          header: `End Date`,
        },
        {
          id: `actions`,
          header: ``,
          meta: {
            class: {
              th: `w-40 text-right`,
            },
          },
        },
      ];
      let f = g_1(() => i.candles);
      return (t, i) => {
        let s = n;
        let d = t_15;
        mt();
        return b_1(`div`, Se, [
          D_1(
            d,
            {
              sorting: On(o),
              "onUpdate:sorting": (i[1] ||= (e) => {
                if (un(o)) {
                  return (o.value = e);
                }
                return null;
              }),
              data: On(f),
              columns,
              loading: e.loading,
              class: `min-w-[48rem]`,
              ui: {
                td: `whitespace-nowrap`,
                th: `whitespace-nowrap`,
              },
            },
            {
              empty: qt(() => [
                _(`div`, Q, [
                  e.candles.length === 0
                    ? (mt(),
                      b_1(`div`, Ce, [
                        (i[3] ||= _(
                          `span`,
                          {
                            class: `text-gray-500 dark:text-gray-400 mb-4 block`,
                          },
                          ` Click the button below to fetch existing candles from the database `,
                          -1,
                        )),
                        _(`div`, we, [
                          D_1(On(r), {
                            icon: `i-heroicons-arrow-path`,
                            label: `Fetch Candles`,
                            onClick: (i[0] ||= (e) => t.$emit(`refresh`)),
                          }),
                          (i[2] ||= _(
                            `p`,
                            {
                              class: `text-sm text-gray-500 dark:text-gray-400 mt-2`,
                            },
                            ` Note: This process might take a few minutes depending on the database size `,
                            -1,
                          )),
                        ]),
                      ]))
                    : (mt(),
                      b_1(`div`, $, [
                        ...(i[4] ||= [
                          _(
                            `span`,
                            {
                              class: `text-gray-500 dark:text-gray-400`,
                            },
                            ` No candles found matching your filters `,
                            -1,
                          ),
                        ]),
                      ])),
                ]),
              ]),
              "exchange-cell": qt(({ row }) => [
                _(`span`, Te, nr(row.original.exchange), 1),
              ]),
              "symbol-cell": qt(({ row }) => [
                _(`span`, Ee, nr(row.original.symbol), 1),
              ]),
              "start_date-cell": qt(({ row }) => [
                _(`span`, De, nr(row.original.start_date), 1),
              ]),
              "end_date-cell": qt(({ row }) => [
                _(`span`, Oe, nr(row.original.end_date), 1),
              ]),
              "actions-cell": qt(({ row }) => [
                _(`div`, ke, [
                  !row.original.isSupported || !row.original.canUpdate
                    ? (mt(),
                      v_1(
                        s,
                        {
                          key: 0,
                          text: row.original.canUpdate
                            ? `This exchange does not support backtesting`
                            : `Import another CSV to add custom candles`,
                        },
                        {
                          default: qt(() => [
                            D_1(
                              On(r),
                              {
                                color: `success`,
                                variant: `ghost`,
                                icon: `i-heroicons-arrow-path`,
                                size: `xs`,
                                label: `Update`,
                                loading: row.original.isUpdating,
                                disabled:
                                  !row.original.isSupported ||
                                  !row.original.canUpdate,
                                onClick: (n) => t.$emit(`update`, row.original),
                              },
                              null,
                              8,
                              [`loading`, `disabled`, `onClick`],
                            ),
                          ]),
                          _: 2,
                        },
                        1032,
                        [`text`],
                      ))
                    : (mt(),
                      v_1(
                        On(r),
                        {
                          key: 1,
                          color: `success`,
                          variant: `ghost`,
                          icon: `i-heroicons-arrow-path`,
                          size: `xs`,
                          label: `Update`,
                          loading: row.original.isUpdating,
                          onClick: (n) => t.$emit(`update`, row.original),
                        },
                        null,
                        8,
                        [`loading`, `onClick`],
                      )),
                  D_1(
                    s,
                    {
                      text: `Copy to another exchange or symbol`,
                    },
                    {
                      default: qt(() => [
                        D_1(
                          On(r),
                          {
                            color: `neutral`,
                            variant: `ghost`,
                            icon: `i-heroicons-document-duplicate`,
                            size: `xs`,
                            label: `Copy`,
                            disabled: row.original.isDeleting,
                            onClick: (n) => t.$emit(`copy`, row.original),
                          },
                          null,
                          8,
                          [`disabled`, `onClick`],
                        ),
                      ]),
                      _: 2,
                    },
                    1024,
                  ),
                  D_1(
                    s,
                    {
                      text: `Export one-minute candles as CSV`,
                    },
                    {
                      default: qt(() => [
                        D_1(
                          On(r),
                          {
                            color: `neutral`,
                            variant: `ghost`,
                            icon: `i-heroicons-arrow-down-tray`,
                            size: `xs`,
                            label: `Export`,
                            onClick: (n) => t.$emit(`export`, row.original),
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
                    s,
                    {
                      text: `Delete`,
                    },
                    {
                      default: qt(() => [
                        D_1(
                          On(r),
                          {
                            color: `error`,
                            variant: `ghost`,
                            icon: `i-heroicons-trash`,
                            size: `xs`,
                            label: `Delete`,
                            loading: row.original.isDeleting,
                            onClick: (n) => t.$emit(`delete`, row.original),
                          },
                          null,
                          8,
                          [`loading`, `onClick`],
                        ),
                      ]),
                      _: 2,
                    },
                    1024,
                  ),
                ]),
              ]),
              _: 1,
            },
            8,
            [`sorting`, `data`, `loading`],
          ),
        ]);
      };
    },
  }),
  {
    __name: `CandlesTable`,
  },
);
const je = {
  class: `container mx-auto max-w-7xl px-4 pt-16 pb-6`,
};
const Me = {
  class: `mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between`,
};
const Ne = {
  class: `flex flex-wrap items-center gap-2`,
};
const Pe = {
  class: `space-y-3 rounded-2xl border border-gray-200 bg-gray-100/70 p-2 shadow-sm dark:border-gray-800 dark:bg-gray-950 sm:p-3`,
};
const Fe = {
  class: `grid grid-cols-1 gap-3 md:grid-cols-3`,
};
const Ie = {
  class: `p-6`,
};
const Le = {
  class: `text-sm text-gray-600 dark:text-gray-400 mb-5`,
};
const Re = {
  class: `font-medium text-gray-900 dark:text-white`,
};
const ze = {
  class: `font-medium text-gray-900 dark:text-white`,
};
const Be = {
  class: `space-y-4 mb-6`,
};
const Ve = {
  class: `flex justify-end gap-3`,
};
const He = {
  class: `p-6`,
};
const Ue = {
  class: `mb-6`,
};
const We = {
  class: `flex justify-end gap-3`,
};
const Ge = k({
  __name: `manage`,
  setup(t) {
    r({
      title: `Manage Candles - Jesse`,
    });
    let i = b_2();
    let a = t_2();
    let o = vn(false);
    let u = vn(false);
    let p = vn(new Set());
    let g = vn(false);
    let v = vn(null);
    let C = vn(false);
    let E = vn(false);
    let k = vn([]);
    let N = vn(false);
    let P = vn(false);
    let R = vn(null);
    let B = gn({
      targetExchange: ``,
      targetSymbol: ``,
      deleteSource: false,
    });
    let ie = [
      {
        label: `All Exchanges`,
        value: `all`,
      },
      {
        label: `Backtesting Only`,
        value: `backtesting`,
      },
      {
        label: `Live Trading Only`,
        value: `live`,
      },
    ];
    let V = vn({
      exchange: ``,
      symbol: ``,
      exchangeType: `all`,
    });
    let ae = g_1(
      () =>
        V.value.exchange !== `` ||
        V.value.symbol !== `` ||
        V.value.exchangeType !== `all`,
    );
    let H = g_1(() => {
      let i_existingCandles = i.existingCandles;
      if (V.value.exchangeType === `backtesting`) {
        i_existingCandles = i_existingCandles.filter((e) =>
          a.backtestingExchangeNames.includes(e.exchange),
        );
      } else if (V.value.exchangeType === `live`) {
        i_existingCandles = i_existingCandles.filter(
          (e) =>
            a.liveTradingExchangeNames.includes(e.exchange) &&
            !a.backtestingExchangeNames.includes(e.exchange),
        );
      }
      if (V.value.exchange) {
        i_existingCandles = i_existingCandles.filter((e) =>
          e.exchange.toLowerCase().includes(V.value.exchange.toLowerCase()),
        );
      }
      if (V.value.symbol) {
        i_existingCandles = i_existingCandles.filter((e) =>
          e.symbol.toLowerCase().includes(V.value.symbol.toLowerCase()),
        );
      }
      return i_existingCandles;
    });
    let U = g_1(() =>
      H.value.map((e) => ({
        ...e,
        isSupported: X(e.exchange),
        canUpdate: e.exchange !== `Custom Data`,
        isUpdating: i.isSymbolUpdating(e.exchange, e.symbol),
        isDeleting: p.value.has(K(e)),
      })),
    );
    let oe = g_1(() => o.value || u.value);
    let se = g_1(() => {
      let e = new Set();
      return i.existingCandles
        .map((e) => e.exchange)
        .filter((t) => {
          if (e.has(t)) {
            return false;
          }
          return (e.add(t), true);
        })
        .sort();
    });
    let W = g_1(() => a.backtestingExchangeNames);
    let G = g_1(() => {
      if (!R.value) {
        return ``;
      }
      let B_targetExchange = B.targetExchange;
      let t = B.targetSymbol.trim().toUpperCase();
      if (B_targetExchange) {
        if (/^[A-Z0-9._]+-[A-Z0-9._]+$/.test(t)) {
          if (B_targetExchange === R.value.exchange && t === R.value.symbol) {
            return `Change the exchange or the symbol; the target must differ from the source.`;
          }
          if (
            i.existingCandles.some(
              (n) => n.exchange === B_targetExchange && n.symbol === t,
            )
          ) {
            return `${t} already has candles on ${B_targetExchange}. Delete them first if you want to replace them.`;
          }
          return ``;
        }
        return `Enter the target symbol as BASE-QUOTE, for example SPY-USDT.`;
      }
      return `Select a target exchange.`;
    });
    let K = (e) => `${e.exchange}-${e.symbol}`;
    function q() {
      V.value = {
        exchange: ``,
        symbol: ``,
        exchangeType: `all`,
      };
    }
    async function J() {
      O_1(
        `success`,
        `Fetching latest candle details. This process might take from a few seconds up to a few minutes depending on the database size.`,
      );
      u.value = true;
      try {
        await i.fetchExistingCandles();
      } finally {
        u.value = false;
        O_1(`success`, `Candles information updated successfully`);
      }
    }
    async function Y() {
      u.value = true;
      try {
        await i.fetchExistingCandles();
      } finally {
        u.value = false;
      }
    }
    function onDelete(e) {
      v.value = e;
      g.value = true;
    }
    function onExport(t) {
      let n = String(s().public.apiBaseUrl ?? ``).replace(/\/+$/, ``);
      let r = document.createElement(`form`);
      r.method = `POST`;
      r.action = `${n}/candles/export`;
      r.style.display = `none`;
      for (let [e, n] of Object.entries({
        exchange: t.exchange,
        symbol: t.symbol,
        token: a.authToken,
      })) {
        let t = document.createElement(`input`);
        t.type = `hidden`;
        t.name = e;
        t.value = String(n);
        r.appendChild(t);
      }
      document.body.appendChild(r);
      r.submit();
      r.remove();
      O_1(`info`, `Export started for ${t.symbol} on ${t.exchange}`);
    }
    async function ue() {
      if (!v.value) {
        return;
      }
      let v_value = v.value;
      let t = K(v_value);
      p.value.add(t);
      try {
        await i.deleteCandles(v_value.exchange, v_value.symbol);
        O_1(`success`, `Candles deleted successfully`);
      } catch {
        O_1(`error`, `Failed to delete candles`);
      } finally {
        p.value.delete(t);
        g.value = false;
        v.value = null;
      }
    }
    async function onUpdate(e) {
      try {
        await i.updateCandles(e.exchange, e.symbol, e.start_date);
        O_1(
          `success`,
          `Started updating candles for ${e.symbol} on ${e.exchange}`,
        );
      } catch {
        O_1(`error`, `Failed to start candle update`);
      }
    }
    function onCopy(e) {
      R.value = e;
      B.targetExchange = ``;
      B.targetSymbol = e.symbol;
      B.deleteSource = false;
      N.value = true;
    }
    function pe() {
      N.value = false;
      R.value = null;
    }
    async function me() {
      if (!R.value || G.value) {
        return;
      }
      let R_value = R.value;
      P.value = true;
      try {
        O_1(
          `success`,
          (
            await i.copyCandles(
              R_value.exchange,
              R_value.symbol,
              B.targetExchange,
              B.targetSymbol.trim().toUpperCase(),
              B.deleteSource,
            )
          ).message,
        );
        N.value = false;
        R.value = null;
        await Y();
      } catch (e) {
        O_1(`error`, e?.data?.error ?? `Failed to copy candles`);
      } finally {
        P.value = false;
      }
    }
    async function he() {
      if (k.value.length !== 0) {
        E.value = true;
        try {
          await i.purgeCandles(k.value);
          O_1(`success`, `Purged all candles for: ${k.value.join(`, `)}`);
          C.value = false;
          k.value = [];
        } catch {
          O_1(`error`, `Failed to purge candles`);
        } finally {
          E.value = false;
        }
      }
    }
    function ge() {
      C.value = false;
      k.value = [];
    }
    let X = (e) => a.backtestingExchangeNames.includes(e);
    if (!i.existingCandles.length) {
      o.value = true;
      i.fetchExistingCandles().finally(() => {
        o.value = false;
      });
    }
    return (e, t) => {
      let i = t_11;
      let a = t_7;
      let d = Z;
      let f = t_1;
      let p = t_9;
      let b = t_5;
      let T = t_10;
      let D = t_14;
      let O = t_12;
      let A = Ae;
      let H = t_3;
      let K = t_8;
      let X = t_4;
      mt();
      return b_1(`div`, je, [
        _(`div`, Me, [
          _(`div`, null, [
            D_1(i, null, {
              default: qt(() => [...(t[13] ||= [E_1(` Manage Candles `, -1)])]),
              _: 1,
            }),
            (t[14] ||= _(
              `p`,
              {
                class: `mt-1 text-sm text-gray-500 dark:text-gray-400`,
              },
              ` Review, update, and remove historical market data stored in Jesse. `,
              -1,
            )),
          ]),
          _(`div`, Ne, [
            D_1(a, {
              icon: `i-heroicons-arrow-left`,
              color: `neutral`,
              variant: `outline`,
              label: `Back to imports`,
              to: `/candles`,
            }),
            D_1(d, {
              onImported: Y,
            }),
            D_1(a, {
              icon: `i-heroicons-trash`,
              color: `error`,
              variant: `soft`,
              label: `Purge`,
              onClick: (t[0] ||= (e) => (C.value = true)),
            }),
            D_1(
              a,
              {
                icon: `i-heroicons-arrow-path`,
                loading: u.value,
                label: `Refresh`,
                onClick: J,
              },
              null,
              8,
              [`loading`],
            ),
          ]),
        ]),
        _(`div`, Pe, [
          D_1(
            T,
            {
              title: `Filters`,
            },
            {
              header: qt(() => [
                ae.value
                  ? (mt(),
                    v_1(a, {
                      key: 0,
                      color: `neutral`,
                      variant: `ghost`,
                      size: `xs`,
                      icon: `i-heroicons-x-mark`,
                      label: `Clear`,
                      onClick: q,
                    }))
                  : y(``, true),
              ]),
              default: qt(() => [
                _(`div`, Fe, [
                  D_1(
                    p,
                    {
                      label: `Exchange`,
                    },
                    {
                      default: qt(() => [
                        D_1(
                          f,
                          {
                            modelValue: V.value.exchange,
                            "onUpdate:modelValue": (t[2] ||= (e) =>
                              (V.value.exchange = e)),
                            icon: `i-heroicons-magnifying-glass`,
                            placeholder: `Search exchanges...`,
                          },
                          {
                            trailing: qt(() => [
                              Yt(
                                D_1(
                                  a,
                                  {
                                    color: `neutral`,
                                    variant: `link`,
                                    icon: `i-heroicons-x-mark-20-solid`,
                                    "aria-label": `Clear exchange filter`,
                                    class: `p-0`,
                                    onClick: (t[1] ||= (e) =>
                                      (V.value.exchange = ``)),
                                  },
                                  null,
                                  512,
                                ),
                                [[qt_1, V.value.exchange !== ``]],
                              ),
                            ]),
                            _: 1,
                          },
                          8,
                          [`modelValue`],
                        ),
                      ]),
                      _: 1,
                    },
                  ),
                  D_1(
                    p,
                    {
                      label: `Symbol`,
                    },
                    {
                      default: qt(() => [
                        D_1(
                          f,
                          {
                            modelValue: V.value.symbol,
                            "onUpdate:modelValue": (t[4] ||= (e) =>
                              (V.value.symbol = e)),
                            icon: `i-heroicons-magnifying-glass`,
                            placeholder: `Search symbols...`,
                          },
                          {
                            trailing: qt(() => [
                              Yt(
                                D_1(
                                  a,
                                  {
                                    color: `neutral`,
                                    variant: `link`,
                                    icon: `i-heroicons-x-mark-20-solid`,
                                    "aria-label": `Clear symbol filter`,
                                    class: `p-0`,
                                    onClick: (t[3] ||= (e) =>
                                      (V.value.symbol = ``)),
                                  },
                                  null,
                                  512,
                                ),
                                [[qt_1, V.value.symbol !== ``]],
                              ),
                            ]),
                            _: 1,
                          },
                          8,
                          [`modelValue`],
                        ),
                      ]),
                      _: 1,
                    },
                  ),
                  D_1(
                    p,
                    {
                      label: `Exchange availability`,
                    },
                    {
                      default: qt(() => [
                        D_1(
                          b,
                          {
                            modelValue: V.value.exchangeType,
                            "onUpdate:modelValue": (t[5] ||= (e) =>
                              (V.value.exchangeType = e)),
                            items: ie,
                            "value-key": `value`,
                            "label-key": `label`,
                            "search-input": false,
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
              ]),
              _: 1,
            },
          ),
          o.value
            ? (mt(),
              v_1(D, {
                key: 0,
                icon: `i-heroicons-information-circle`,
                color: `neutral`,
                title: `Loading candles...`,
                description: `This process might take from a few seconds up to a few minutes.`,
              }))
            : y(``, true),
          D_1(
            T,
            {
              title: `Stored candles`,
              flush: ``,
              "overflow-hidden": ``,
            },
            {
              header: qt(() => [
                D_1(
                  O,
                  {
                    color: `neutral`,
                    variant: `soft`,
                    size: `xs`,
                  },
                  {
                    default: qt(() => [E_1(nr(U.value.length), 1)]),
                    _: 1,
                  },
                ),
              ]),
              default: qt(() => [
                D_1(
                  A,
                  {
                    candles: U.value,
                    loading: oe.value,
                    onRefresh: J,
                    onUpdate,
                    onExport,
                    onCopy,
                    onDelete,
                  },
                  null,
                  8,
                  [`candles`, `loading`],
                ),
              ]),
              _: 1,
            },
          ),
        ]),
        D_1(
          H,
          {
            modelValue: g.value,
            "onUpdate:modelValue": (t[6] ||= (e) => (g.value = e)),
            title: `Delete Candles`,
            description: `Are you sure you want to delete all candles for "${v.value?.symbol}" on "${v.value?.exchange}"?`,
            type: `info`,
          },
          {
            default: qt(() => [
              D_1(a, {
                variant: `solid`,
                color: `error`,
                block: ``,
                class: `sm:w-auto`,
                label: `Delete`,
                onClick: ue,
              }),
            ]),
            _: 1,
          },
          8,
          [`modelValue`, `description`],
        ),
        D_1(
          X,
          {
            open: N.value,
            "onUpdate:open": (t[10] ||= (e) => (N.value = e)),
          },
          {
            content: qt(() => [
              _(`div`, Ie, [
                (t[18] ||= _(
                  `h3`,
                  {
                    class: `text-lg font-semibold text-gray-900 dark:text-white mb-1`,
                  },
                  ` Copy Candles `,
                  -1,
                )),
                _(`p`, Le, [
                  (t[15] ||= E_1(` Make `, -1)),
                  _(`span`, Re, nr(R.value?.symbol), 1),
                  (t[16] ||= E_1(` on `, -1)),
                  _(`span`, ze, nr(R.value?.exchange), 1),
                  (t[17] ||= E_1(
                    ` available under another exchange or symbol, so you can select it in backtests as that market. Every stored timeframe is copied. `,
                    -1,
                  )),
                ]),
                _(`div`, Be, [
                  D_1(
                    p,
                    {
                      label: `Target exchange`,
                    },
                    {
                      default: qt(() => [
                        D_1(
                          b,
                          {
                            modelValue: B.targetExchange,
                            "onUpdate:modelValue": (t[7] ||= (e) =>
                              (B.targetExchange = e)),
                            "aria-label": `Target exchange`,
                            "data-testid": `copy-target-exchange`,
                            items: W.value,
                            "search-input": {
                              placeholder: `Search exchanges...`,
                            },
                            placeholder: `Select exchange...`,
                            class: `w-full`,
                          },
                          null,
                          8,
                          [`modelValue`, `items`],
                        ),
                      ]),
                      _: 1,
                    },
                  ),
                  D_1(
                    p,
                    {
                      label: `Target symbol`,
                      help: `Use the target market's quote currency, e.g. SPY-USDT for a USDT exchange.`,
                    },
                    {
                      default: qt(() => [
                        D_1(
                          f,
                          {
                            modelValue: B.targetSymbol,
                            "onUpdate:modelValue": (t[8] ||= (e) =>
                              (B.targetSymbol = e)),
                            "aria-label": `Target symbol`,
                            "data-testid": `copy-target-symbol`,
                            placeholder: `BASE-QUOTE`,
                            class: `w-full`,
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
                    K,
                    {
                      modelValue: B.deleteSource,
                      "onUpdate:modelValue": (t[9] ||= (e) =>
                        (B.deleteSource = e)),
                      "data-testid": `copy-delete-source`,
                      label: `Delete the original after copying`,
                      description: `Turns the copy into a rename. Provider updates only work under the original exchange name, so keep the original if you plan to update it later.`,
                    },
                    null,
                    8,
                    [`modelValue`],
                  ),
                  G.value
                    ? (mt(),
                      v_1(
                        D,
                        {
                          key: 0,
                          color: `warning`,
                          variant: `soft`,
                          icon: `i-heroicons-exclamation-triangle`,
                          title: G.value,
                        },
                        null,
                        8,
                        [`title`],
                      ))
                    : y(``, true),
                ]),
                _(`div`, Ve, [
                  D_1(a, {
                    color: `neutral`,
                    variant: `ghost`,
                    label: `Cancel`,
                    onClick: pe,
                  }),
                  D_1(
                    a,
                    {
                      "data-testid": `copy-confirm`,
                      label: B.deleteSource ? `Move` : `Copy`,
                      disabled: !R.value || !!G.value,
                      loading: P.value,
                      onClick: me,
                    },
                    null,
                    8,
                    [`label`, `disabled`, `loading`],
                  ),
                ]),
              ]),
            ]),
            _: 1,
          },
          8,
          [`open`],
        ),
        D_1(
          X,
          {
            open: C.value,
            "onUpdate:open": (t[12] ||= (e) => (C.value = e)),
          },
          {
            content: qt(() => [
              _(`div`, He, [
                (t[21] ||= _(
                  `h3`,
                  {
                    class: `text-lg font-semibold text-gray-900 dark:text-white mb-4`,
                  },
                  ` Purge Candles by Exchange `,
                  -1,
                )),
                _(`div`, Ue, [
                  (t[19] ||= _(
                    `div`,
                    {
                      class: `bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4`,
                    },
                    [
                      _(
                        `div`,
                        {
                          class: `flex items-start gap-3`,
                        },
                        [
                          _(`i`, {
                            class: `i-heroicons-exclamation-triangle text-red-600 dark:text-red-400 text-xl shrink-0 mt-0.5`,
                          }),
                          _(
                            `div`,
                            {
                              class: `text-sm text-red-800 dark:text-red-200`,
                            },
                            [
                              _(
                                `p`,
                                {
                                  class: `font-semibold mb-1`,
                                },
                                ` Warning: This action is permanent! `,
                              ),
                              _(
                                `p`,
                                null,
                                `All candles for the selected exchange(s) will be deleted and cannot be recovered.`,
                              ),
                            ],
                          ),
                        ],
                      ),
                    ],
                    -1,
                  )),
                  D_1(
                    p,
                    {
                      label: `Select exchange(s) to purge:`,
                      class: `mb-4`,
                    },
                    {
                      default: qt(() => [
                        D_1(
                          b,
                          {
                            modelValue: k.value,
                            "onUpdate:modelValue": (t[11] ||= (e) =>
                              (k.value = e)),
                            items: se.value,
                            "search-input": false,
                            multiple: ``,
                            placeholder: `Select one or more exchanges...`,
                          },
                          null,
                          8,
                          [`modelValue`, `items`],
                        ),
                      ]),
                      _: 1,
                    },
                  ),
                  (t[20] ||= _(
                    `p`,
                    {
                      class: `text-sm text-gray-600 dark:text-gray-400`,
                    },
                    ` This will permanently delete all candles for every symbol under the selected exchange(s). `,
                    -1,
                  )),
                ]),
                _(`div`, We, [
                  D_1(a, {
                    color: `neutral`,
                    variant: `ghost`,
                    label: `Cancel`,
                    onClick: ge,
                  }),
                  D_1(
                    a,
                    {
                      color: `error`,
                      label: `Purge`,
                      disabled: k.value.length === 0,
                      loading: E.value,
                      onClick: he,
                    },
                    null,
                    8,
                    [`disabled`, `loading`],
                  ),
                ]),
              ]),
            ]),
            _: 1,
          },
          8,
          [`open`],
        ),
      ]);
    };
  },
});
export { Ge as default };
