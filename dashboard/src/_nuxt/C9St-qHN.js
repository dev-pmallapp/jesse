import {
  D as D_1,
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
import { Yt } from "./Cd-sGgPF.js";
import { n as n_1, t as t_1 } from "./2k_QeT3T.js";
import { D as D_2, S, ut } from "./B8_r5oP7.js";
import { f } from "./OaeI3Ulg.js";
import { i, t as t_2 } from "./CJNUlr67.js";
import { t as t_3 } from "./D_Sm39l5.js";
const D = ut(`periodTemplates`, {
  state: () => ({
    templates: [],
    fetched: false,
  }),
  actions: {
    async fetch() {
      if (this.fetched) {
        return;
      }
      let { data, error } = await S(`/period-templates/list`, {
        method: `POST`,
        authenticated: true,
      });
      if (!(error.value && error.value.statusCode !== 200)) {
        this.templates = data.value.templates || [];
        this.fetched = true;
      }
    },
    async add(start_date, finish_date) {
      let { data, error } = await S(`/period-templates/add`, {
        method: `POST`,
        body: {
          start_date,
          finish_date,
        },
        authenticated: true,
      });
      if (error.value && error.value.statusCode !== 200) {
        D_2(error);
        return;
      }
      this.templates = data.value.templates || [];
    },
    async remove(e) {
      this.templates = this.templates.filter((t) => t.id !== e);
      let { error } = await S(`/period-templates/remove`, {
        method: `POST`,
        body: {
          id: e,
        },
        authenticated: true,
      });
      if (error.value && error.value.statusCode !== 200) {
        D_2(error);
      }
    },
    async touch(e) {
      let t = this.templates.find((t) => t.id === e);
      if (t) {
        t.last_used_at = Date.now();
      }
      let { error } = await S(`/period-templates/touch`, {
        method: `POST`,
        body: {
          id: e,
        },
        authenticated: true,
      });
      if (error.value && error.value.statusCode !== 200) {
        D_2(error);
      }
    },
  },
});
const O = {
  class: `mb-3 flex items-center justify-between gap-4`,
};
const k = {
  class: `text-xs tabular-nums text-gray-400 dark:text-gray-500`,
};
const A = {
  class: `grid grid-cols-2 gap-2 select-none sm:grid-cols-4`,
};
const j = [`onClick`];
const M = {
  class: `mt-0.5 text-[10px] tabular-nums text-gray-400 dark:text-gray-500`,
};
const N = [`onClick`];
const P = [`onClick`];
const F = {
  class: `mt-0.5 text-[10px] tabular-nums text-gray-400 dark:text-gray-500`,
};
const I = {
  key: 0,
  class: `mt-3 flex items-center gap-2 select-none`,
};
export const t = Object.assign(
  k_1({
    __name: `PeriodPicker`,
    props: {
      start: {
        required: true,
      },
      startModifiers: {},
      finish: {
        required: true,
      },
      finishModifiers: {},
    },
    emits: [`update:start`, `update:finish`],
    setup(l) {
      let b = Ft(l, `start`);
      let x = Ft(l, `finish`);
      let S = D();
      S.fetch();
      let L = [
        {
          key: `3m`,
          title: `Last 3 months`,
        },
        {
          key: `6m`,
          title: `Last 6 months`,
        },
        {
          key: `ytd`,
          title: `Year to date`,
        },
        {
          key: `1y`,
          title: `Last year`,
        },
        {
          key: `2y`,
          title: `Last 2 years`,
        },
        {
          key: `3y`,
          title: `Last 3 years`,
        },
      ];
      let R = vn(`custom`);
      function z(e) {
        let t = new Date(Date.now() - 86400000);
        let n = new Date(t);
        if (e === `3m`) {
          n.setMonth(n.getMonth() - 3);
        } else if (e === `6m`) {
          n.setMonth(n.getMonth() - 6);
        } else if (e === `ytd`) {
          n.setMonth(0);
          n.setDate(1);
        } else if (e === `1y`) {
          n.setFullYear(n.getFullYear() - 1);
        } else if (e === `2y`) {
          n.setFullYear(n.getFullYear() - 2);
        } else if (e === `3y`) {
          n.setFullYear(n.getFullYear() - 3);
        }
        return [n.toISOString().slice(0, 10), t.toISOString().slice(0, 10)];
      }
      let B = vn(false);
      function V(e) {
        B.value = false;
        let [t, n] = z(e);
        b.value = t;
        x.value = n;
      }
      function H(e) {
        B.value = false;
        b.value = e.start_date;
        x.value = e.finish_date;
        S.touch(e.id);
      }
      function U() {
        B.value = true;
        R.value = `custom`;
      }
      let W = g(() => B.value || (R.value === `custom` && !G.value));
      let G = g(
        () =>
          S.templates.find(
            (e) => e.start_date === b.value && e.finish_date === x.value,
          )?.id ?? null,
      );
      Ht(
        () => [b.value, x.value],
        ([e, t]) => {
          let n = L.find((n) => {
            let [r, i] = z(n.key);
            return r === e && i === t;
          });
          R.value = n ? n.key : `custom`;
        },
        {
          immediate: true,
        },
      );
      let K = g(() => {
        let e = new Date(x.value).getTime() - new Date(b.value).getTime();
        return Math.max(0, Math.round(e / 86400000));
      });
      return (t, n) => {
        let c = n_1;
        let l = t_1;
        let h = i;
        let D = t_2;
        mt();
        return b_1(`div`, null, [
          _(`div`, O, [
            (n[4] ||= _(
              `span`,
              {
                class: `shrink-0 text-sm font-medium text-gray-500 dark:text-gray-400`,
              },
              `Period`,
              -1,
            )),
            _(`span`, k, nr(On(K)) + ` days`, 1),
          ]),
          _(`div`, A, [
            (mt(true),
            b_1(
              o,
              null,
              bt(On(S).templates, (n) => {
                mt();
                return b_1(
                  `div`,
                  {
                    key: n.id,
                    class: `group relative`,
                  },
                  [
                    _(
                      `button`,
                      {
                        class: Qn([
                          `w-full rounded-lg border px-3 py-2.5 text-left`,
                          On(G) === n.id && !On(B)
                            ? `border-indigo-400 bg-indigo-50 dark:border-indigo-500/60 dark:bg-indigo-500/10`
                            : `border-gray-200 bg-gray-50 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800/70 dark:hover:border-gray-600`,
                        ]),
                        onClick: (e) => H(n),
                      },
                      [
                        _(
                          `div`,
                          {
                            class: Qn([
                              `text-xs font-semibold tabular-nums`,
                              On(G) === n.id && !On(B)
                                ? `text-indigo-600 dark:text-indigo-300`
                                : `text-gray-700 dark:text-gray-200`,
                            ]),
                          },
                          nr(n.start_date) + ` → ` + nr(n.finish_date),
                          3,
                        ),
                        _(
                          `div`,
                          M,
                          nr(
                            (`daysBetween` in t ? t.daysBetween : On(t_3))(
                              n.start_date,
                              n.finish_date,
                            ),
                          ) + ` days`,
                          1,
                        ),
                      ],
                      10,
                      j,
                    ),
                    D_1(
                      c,
                      {
                        text: `Delete preset`,
                        arrow: ``,
                        class: `absolute -top-2.5 -right-2.5 hidden group-hover:block`,
                      },
                      {
                        default: qt(() => [
                          _(
                            `button`,
                            {
                              "aria-label": `Delete preset`,
                              class: `flex size-5 items-center justify-center rounded-full border border-gray-200 bg-white p-0 text-gray-400 hover:text-rose-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-500 dark:hover:text-rose-400`,
                              onClick: Yt((e) => On(S).remove(n.id), [`stop`]),
                            },
                            [
                              D_1(On(f), {
                                class: `block size-3.5 translate-x-0.5`,
                                "aria-hidden": `true`,
                              }),
                            ],
                            8,
                            N,
                          ),
                        ]),
                        _: 2,
                      },
                      1024,
                    ),
                  ],
                );
              }),
              128,
            )),
            (mt(),
            b_1(
              o,
              null,
              bt(L, (e) =>
                _(
                  `button`,
                  {
                    key: e.key,
                    class: Qn([
                      `rounded-lg border px-3 py-2.5 text-left`,
                      On(R) === e.key
                        ? `border-indigo-400 bg-indigo-50 dark:border-indigo-500/60 dark:bg-indigo-500/10`
                        : `border-gray-200 bg-gray-50 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800/70 dark:hover:border-gray-600`,
                    ]),
                    onClick: (t) => V(e.key),
                  },
                  [
                    _(
                      `div`,
                      {
                        class: Qn([
                          `text-xs font-semibold`,
                          On(R) === e.key
                            ? `text-indigo-600 dark:text-indigo-300`
                            : `text-gray-700 dark:text-gray-200`,
                        ]),
                      },
                      nr(e.title),
                      3,
                    ),
                    _(`div`, F, `from ` + nr(z(e.key)[0]), 1),
                  ],
                  10,
                  P,
                ),
              ),
              64,
            )),
            _(
              `button`,
              {
                class: Qn([
                  `rounded-lg border px-3 py-2.5 text-left`,
                  On(W)
                    ? `border-indigo-400 bg-indigo-50 dark:border-indigo-500/60 dark:bg-indigo-500/10`
                    : `border-gray-200 bg-gray-50 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800/70 dark:hover:border-gray-600`,
                ]),
                onClick: (n[0] ||= (e) => U()),
              },
              [
                _(
                  `div`,
                  {
                    class: Qn([
                      `text-xs font-semibold`,
                      On(W)
                        ? `text-indigo-600 dark:text-indigo-300`
                        : `text-gray-700 dark:text-gray-200`,
                    ]),
                  },
                  ` Custom `,
                  2,
                ),
                (n[5] ||= _(
                  `div`,
                  {
                    class: `mt-0.5 text-[10px] text-gray-400 dark:text-gray-500`,
                  },
                  `pick exact dates`,
                  -1,
                )),
              ],
              2,
            ),
          ]),
          On(W)
            ? (mt(),
              b_1(`div`, I, [
                D_1(
                  l,
                  {
                    modelValue: b.value,
                    "onUpdate:modelValue": (n[1] ||= (e) => (b.value = e)),
                    type: `date`,
                    variant: `outline`,
                    class: `w-full`,
                  },
                  null,
                  8,
                  [`modelValue`],
                ),
                D_1(h, {
                  name: `i-heroicons-arrow-right`,
                  class: `size-4 shrink-0 text-gray-400 dark:text-gray-600`,
                }),
                D_1(
                  l,
                  {
                    modelValue: x.value,
                    "onUpdate:modelValue": (n[2] ||= (e) => (x.value = e)),
                    type: `date`,
                    variant: `outline`,
                    class: `w-full`,
                  },
                  null,
                  8,
                  [`modelValue`],
                ),
                On(G)
                  ? y(``, true)
                  : (mt(),
                    v(
                      c,
                      {
                        key: 0,
                        text: `Save this range as a preset`,
                        arrow: ``,
                      },
                      {
                        default: qt(() => [
                          D_1(D, {
                            size: `xs`,
                            color: `neutral`,
                            variant: `soft`,
                            icon: `i-heroicons-bookmark`,
                            class: `shrink-0`,
                            onClick: (n[3] ||= (e) =>
                              On(S).add(b.value, x.value)),
                          }),
                        ]),
                        _: 1,
                      },
                    )),
              ]))
            : y(``, true),
        ]);
      };
    },
  }),
  {
    __name: `PeriodPicker`,
  },
);
