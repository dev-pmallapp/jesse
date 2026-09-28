import {
  D,
  E,
  On,
  _,
  b as b_1,
  bt,
  ct,
  g,
  gn,
  k,
  mt,
  nr,
  o as o_1,
  qt,
  v as v_1,
  vn,
  y as y_1,
} from "./CoKk4mC0.js";
import { n, t } from "./2k_QeT3T.js";
import { a, b as b_2, i, t as t_2, w } from "./B8_r5oP7.js";
import { r } from "./BpBaBBm3.js";
import { t as t_3 } from "./Cf85K_3V.js";
import { i as i_2, t as t_4 } from "./CJNUlr67.js";
import { t as t_5 } from "./BG8CfSEZ2.js";
import { t as t_6 } from "./EoqKQiEy2.js";
import { t as t_7 } from "./JgXkd7uo2.js";
import { t as t_8 } from "./DEJw_qiA2.js";
import { t as t_9 } from "./BRqV1csJ.js";
import { t as t_10 } from "./uf1cV9ZP.js";
import { n as n_2, r as r_2, t as t_11 } from "./Beywemwu.js";
const oe = {
  class: `container mx-auto max-w-7xl px-4 pt-16 pb-6`,
};
const j = {
  class: `mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between`,
};
const M = {
  class: `flex flex-wrap items-center gap-2`,
};
const N = {
  class: `rounded-2xl border border-gray-200 bg-gray-100/70 p-2 shadow-sm dark:border-gray-800 dark:bg-gray-950 sm:p-3`,
};
const P = {
  class: `space-y-3`,
};
const F = {
  class: `grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)_minmax(0,0.8fr)]`,
};
const I = {
  class: `mt-3 flex flex-col gap-2 sm:flex-row sm:items-center`,
};
const L = {
  key: 0,
  class: `inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400`,
};
const R = {
  class: `flex flex-wrap items-center justify-end gap-1.5 sm:ml-auto`,
};
const z = k({
  __name: `index`,
  setup(l) {
    r({
      title: `Import Candles - Jesse`,
    });
    let z = b_2();
    let B = t_2();
    let V = gn({});
    let H = vn(new Set());
    let U = new Map();
    let W = i();
    let G = g(() =>
      B.backtestingExchangeNames.filter((e) => e !== `Custom Data`),
    );
    let se = g(() => z.forms.some((e) => !e.executing && !e.waiting));
    let K = g(() => z.forms.some((e) => e.executing || e.waiting));
    let q = vn(new Set());
    let J = vn(new Set());
    function ce() {
      z.addImport();
    }
    function le(e) {
      z.duplicateImport(e);
    }
    async function ue(e) {
      q.value.add(e.id);
      if (e.executing || e.waiting) {
        await $(e.id);
      }
      let t = z.forms.indexOf(e);
      if (z.forms.length > 1) {
        z.forms.splice(t, 1);
      }
      q.value.delete(e.id);
    }
    function Y(e) {
      return B.exchangeSupportedSymbols[e]?.data ?? [];
    }
    function X(e) {
      return H.value.has(e);
    }
    function de(e) {
      if (X(e.exchange)) {
        return `Loading symbols...`;
      }
      return n_2(V[e.id] ?? ``, e.exchange);
    }
    function fe(e) {
      let t = B.getExchangeSymbolDetails(e.exchange);
      return r_2(t_11(Y(e.exchange), t, V[e.id] ?? ``), t);
    }
    function pe(e) {
      let t = U.get(e);
      if (t) {
        return t;
      }
      H.value.add(e);
      let n = B.getExchangeSupportedSymbols(e).finally(() => {
        U.delete(e);
        H.value.delete(e);
      });
      U.set(e, n);
      return n;
    }
    async function Z(e) {
      let e_exchange = e.exchange;
      if (!e_exchange) {
        return;
      }
      let e_symbol = e.symbol;
      e.symbol = Y(e_exchange).includes(e_symbol) ? e_symbol : ``;
      let r = await pe(e_exchange);
      if (e.exchange === e_exchange) {
        e.symbol = r.includes(e_symbol) ? e_symbol : (r[0] ?? ``);
      }
    }
    function Q(e) {
      let t = z.forms.find((t) => t.id === e);
      if (t && me(t)) {
        z.start(e);
      }
    }
    function me(e) {
      return a(e);
    }
    ct(() => {
      z.reconcileQueue();
      if (!z.forms[0].exchange) {
        z.forms[0].exchange = G.value[0];
      }
      setTimeout(() => {
        for (let e of z.forms) {
          Z(e);
        }
      }, 100);
    });
    async function $(e) {
      J.value.add(e);
      await z.cancel(e);
      J.value.delete(e);
    }
    async function he() {
      let e = z.forms.filter((e) => !e.executing && !e.waiting);
      await Promise.all(e.map((e) => Q(e.id)));
    }
    async function ge() {
      let e = z.forms.filter((e) => e.executing || e.waiting);
      await Promise.all(e.map((e) => $(e.id)));
    }
    return (o, s) => {
      let c = t_8;
      let l = t_4;
      let m = t_3;
      let v = t_5;
      let y = t;
      let b = t_10;
      let x = t_6;
      let S = i_2;
      let O = t_9;
      let k = n;
      let A = t_7;
      mt();
      return b_1(`div`, oe, [
        _(`div`, j, [
          _(`div`, null, [
            D(c, null, {
              default: qt(() => [...(s[0] ||= [E(` Import Candles `, -1)])]),
              _: 1,
            }),
            (s[1] ||= _(
              `p`,
              {
                class: `mt-1 text-sm text-gray-500 dark:text-gray-400`,
              },
              ` Download historical market data for backtesting and research. `,
              -1,
            )),
          ]),
          _(`div`, M, [
            D(l, {
              icon: `i-heroicons-plus`,
              color: `neutral`,
              variant: `outline`,
              label: `Add import`,
              onClick: ce,
            }),
            On(z).forms.length > 1
              ? (mt(),
                b_1(
                  o_1,
                  {
                    key: 0,
                  },
                  [
                    D(
                      l,
                      {
                        icon: `i-heroicons-arrow-down-tray`,
                        label: `Import all`,
                        disabled: !se.value,
                        onClick: he,
                      },
                      null,
                      8,
                      [`disabled`],
                    ),
                    D(
                      l,
                      {
                        icon: `i-heroicons-x-mark`,
                        variant: `soft`,
                        color: `error`,
                        label: `Cancel all`,
                        disabled: !K.value,
                        onClick: ge,
                      },
                      null,
                      8,
                      [`disabled`],
                    ),
                  ],
                  64,
                ))
              : y_1(``, true),
            D(l, {
              icon: `i-heroicons-circle-stack`,
              variant: `outline`,
              color: `neutral`,
              label: `Manage`,
              to: `/candles/manage`,
            }),
          ]),
        ]),
        _(`div`, N, [
          _(`div`, P, [
            (mt(true),
            b_1(
              o_1,
              null,
              bt(On(z).forms, (a) => {
                mt();
                return v_1(
                  A,
                  {
                    key: a.id,
                  },
                  {
                    default: qt(() => [
                      _(`div`, F, [
                        D(
                          v,
                          {
                            label: `Exchange`,
                          },
                          {
                            default: qt(() => [
                              D(
                                m,
                                {
                                  modelValue: a.exchange,
                                  "onUpdate:modelValue": [
                                    (e) => (a.exchange = e),
                                    () => Z(a),
                                  ],
                                  "aria-label": `Exchange`,
                                  "data-testid": `candle-import-exchange`,
                                  items: G.value,
                                  content: {
                                    side: `top`,
                                    sideOffset: 8,
                                    collisionPadding: 12,
                                  },
                                  placeholder: `Select exchange...`,
                                },
                                null,
                                8,
                                [`modelValue`, `onUpdate:modelValue`, `items`],
                              ),
                            ]),
                            _: 2,
                          },
                          1024,
                        ),
                        D(
                          v,
                          {
                            label: `Symbol`,
                          },
                          {
                            default: qt(() => [
                              D(
                                m,
                                {
                                  modelValue: a.symbol,
                                  "onUpdate:modelValue": [
                                    (e) => (a.symbol = e),
                                    (e) => (On(V)[a.id] = ``),
                                  ],
                                  "search-term": On(V)[a.id],
                                  "onUpdate:searchTerm": (e) =>
                                    (On(V)[a.id] = e),
                                  "aria-label": `Symbol`,
                                  "data-testid": `candle-import-symbol`,
                                  items: fe(a),
                                  "value-key": `label`,
                                  "ignore-filter": ``,
                                  loading: X(a.exchange),
                                  content: {
                                    side: `top`,
                                    sideOffset: 8,
                                    collisionPadding: 12,
                                  },
                                  placeholder: `Select symbol...`,
                                },
                                {
                                  empty: qt(() => [E(nr(de(a)), 1)]),
                                  _: 2,
                                },
                                1032,
                                [
                                  `modelValue`,
                                  `onUpdate:modelValue`,
                                  `search-term`,
                                  `onUpdate:searchTerm`,
                                  `items`,
                                  `loading`,
                                ],
                              ),
                            ]),
                            _: 2,
                          },
                          1024,
                        ),
                        D(
                          v,
                          {
                            label: `Start date`,
                          },
                          {
                            default: qt(() => [
                              D(
                                y,
                                {
                                  modelValue: a.start_date,
                                  "onUpdate:modelValue": (e) =>
                                    (a.start_date = e),
                                  type: `date`,
                                  max: On(W),
                                },
                                null,
                                8,
                                [`modelValue`, `onUpdate:modelValue`, `max`],
                              ),
                            ]),
                            _: 2,
                          },
                          1024,
                        ),
                      ]),
                      a.alert.type === `info`
                        ? (mt(),
                          v_1(
                            b,
                            {
                              key: 0,
                              class: `mt-4`,
                              color: `neutral`,
                              variant: `soft`,
                              icon: `i-heroicons-information-circle`,
                              title: a.alert.message,
                            },
                            null,
                            8,
                            [`title`],
                          ))
                        : y_1(``, true),
                      a.waiting
                        ? (mt(),
                          v_1(
                            b,
                            {
                              key: 1,
                              class: `mt-4`,
                              color: `warning`,
                              variant: `soft`,
                              icon: `i-heroicons-clock`,
                              title: `Queued: Waiting for the current '${a.exchange}' import to finish...`,
                            },
                            null,
                            8,
                            [`title`],
                          ))
                        : a.executing
                          ? (mt(),
                            v_1(
                              x,
                              {
                                key: 2,
                                "model-value": a.progressbar.current,
                                status: ``,
                                class: `mt-4 w-full`,
                              },
                              null,
                              8,
                              [`model-value`],
                            ))
                          : a.exception.error
                            ? (mt(),
                              v_1(
                                b,
                                {
                                  key: 3,
                                  class: `mt-4`,
                                  color: `error`,
                                  variant: `soft`,
                                  icon: `i-heroicons-exclamation-triangle`,
                                  title: a.exception.error,
                                },
                                null,
                                8,
                                [`title`],
                              ))
                            : a.alert.type === `success`
                              ? (mt(),
                                v_1(
                                  b,
                                  {
                                    key: 4,
                                    class: `mt-4`,
                                    color: `success`,
                                    variant: `soft`,
                                    icon: `i-heroicons-check-circle`,
                                    title: a.alert.message,
                                  },
                                  null,
                                  8,
                                  [`title`],
                                ))
                              : y_1(``, true),
                      _(`div`, I, [
                        a.executing
                          ? (mt(),
                            b_1(`span`, L, [
                              D(S, {
                                name: `i-heroicons-clock`,
                                class: `size-3.5`,
                              }),
                              D(
                                O,
                                {
                                  text: On(w).remainingTimeText(
                                    a.progressbar.estimated_remaining_seconds,
                                  ),
                                },
                                null,
                                8,
                                [`text`],
                              ),
                            ]))
                          : y_1(``, true),
                        _(`div`, R, [
                          !a.executing && !a.waiting
                            ? (mt(),
                              v_1(
                                l,
                                {
                                  key: 0,
                                  size: `sm`,
                                  label: `Import`,
                                  icon: `i-heroicons-arrow-down-tray`,
                                  onClick: (e) => Q(a.id),
                                },
                                null,
                                8,
                                [`onClick`],
                              ))
                            : (mt(),
                              v_1(
                                l,
                                {
                                  key: 1,
                                  size: `sm`,
                                  variant: `soft`,
                                  color: `error`,
                                  label: `Cancel`,
                                  icon: `i-heroicons-x-mark`,
                                  loading: J.value.has(a.id),
                                  onClick: (e) => $(a.id),
                                },
                                null,
                                8,
                                [`loading`, `onClick`],
                              )),
                          D(
                            k,
                            {
                              text: `Duplicate`,
                            },
                            {
                              default: qt(() => [
                                D(
                                  l,
                                  {
                                    size: `sm`,
                                    variant: `ghost`,
                                    color: `neutral`,
                                    icon: `i-heroicons-document-duplicate`,
                                    "aria-label": `Duplicate import`,
                                    onClick: (e) => le(a),
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
                          On(z).forms.length > 1
                            ? (mt(),
                              v_1(
                                k,
                                {
                                  key: 2,
                                  text: `Delete`,
                                },
                                {
                                  default: qt(() => [
                                    D(
                                      l,
                                      {
                                        size: `sm`,
                                        variant: `ghost`,
                                        color: `error`,
                                        icon: `i-heroicons-trash`,
                                        "aria-label": `Delete import`,
                                        loading: q.value.has(a.id),
                                        onClick: (e) => ue(a),
                                      },
                                      null,
                                      8,
                                      [`loading`, `onClick`],
                                    ),
                                  ]),
                                  _: 2,
                                },
                                1024,
                              ))
                            : y_1(``, true),
                        ]),
                      ]),
                    ]),
                    _: 2,
                  },
                  1024,
                );
              }),
              128,
            )),
          ]),
        ]),
      ]);
    };
  },
});
export { z as default };
