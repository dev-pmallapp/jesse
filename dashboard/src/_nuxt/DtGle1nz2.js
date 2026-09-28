import { n as n_1 } from "./QTnfLwEv.js";
import {
  D,
  E as E_1,
  On,
  Qn,
  _,
  b,
  bt,
  ct,
  g,
  gn,
  k,
  mt,
  nr,
  o,
  qt,
  un,
  v as v_1,
  vn,
  wt,
  y,
} from "./CoKk4mC0.js";
import { t as t_1 } from "./2k_QeT3T.js";
import { O, S, t as t_2, x } from "./B8_r5oP7.js";
import { r } from "./BpBaBBm3.js";
import { t as t_3 } from "./atteXEGs.js";
import { i, t as t_4 } from "./CJNUlr67.js";
import { t as t_5 } from "./BG8CfSEZ2.js";
import { t as t_6 } from "./JgXkd7uo2.js";
import { t as t_7 } from "./DEJw_qiA2.js";
import { t as t_8 } from "./B4Wc4BFL2.js";
import { t as t_9 } from "./TtSlr_h_2.js";
import { t as t_10 } from "./CUL-_UXV2.js";
const P = {
  class: `space-y-4`,
};
const F = {
  class: `space-y-2 text-sm text-gray-600 dark:text-gray-300`,
};
const I = {
  href: `https://massive.com`,
  target: `_blank`,
  rel: `noopener noreferrer`,
  class: `inline-flex items-center gap-1 font-medium text-primary hover:underline`,
};
const L = {
  class: `mt-2 flex flex-wrap gap-2`,
};
const R = {
  class: `flex items-start gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 dark:border-gray-700 dark:bg-gray-800/60`,
};
const z = {
  key: 0,
  class: `flex flex-col gap-3 rounded-lg bg-gray-50 px-3 py-3 dark:bg-gray-800/60 sm:flex-row sm:items-center sm:justify-between`,
};
const B = {
  class: `flex items-center gap-2.5`,
};
const V = {
  key: 0,
  class: `mt-0.5 text-xs text-gray-500 dark:text-gray-400`,
};
const H = {
  class: `flex flex-col gap-2 sm:flex-row sm:items-center`,
};
const U = {
  class: `flex justify-end`,
};
const W = `Massive`;
export const t = k({
  __name: `data-providers`,
  props: {
    embedded: {
      type: Boolean,
      default: false,
    },
  },
  setup(e) {
    let d = [`Stocks`, `Futures`, `Indices`, `Currencies`];
    if (!e.embedded) {
      r({
        title: `Data Providers`,
      });
    }
    let G = t_2();
    let K = gn({
      apiKey: ``,
    });
    let q = vn(false);
    let J = vn(false);
    let Y = vn(false);
    let X = vn(false);
    let Z = g(() => G.dataProviderCredentials.find((e) => e.provider_id === W));
    let Q = g(() => Z.value?.configured === true);
    let ne = g(() => {
      if (Z.value?.created_at) {
        return new Date(Z.value.created_at).toLocaleString();
      }
      return ``;
    });
    function $(e) {
      let t = G.dataProviderCredentials.findIndex(
        (t) => t.provider_id === e.provider_id,
      );
      if (t === -1) {
        G.dataProviderCredentials.push(e);
      } else {
        G.dataProviderCredentials.splice(t, 1, e);
      }
    }
    async function onSubmit() {
      let e = K.apiKey.trim();
      if (!e) {
        return;
      }
      q.value = true;
      let { data, error } = await S(`/data-providers/credentials/store`, {
        method: `POST`,
        body: {
          provider_id: W,
          api_key: e,
        },
        authenticated: true,
      });
      q.value = false;
      if (error.value || !data.value) {
        O(`error`, x(error.value, `Unable to save the Massive API key`));
        return;
      }
      $(data.value.data);
      K.apiKey = ``;
      O(`success`, `Massive API key saved successfully`);
    }
    async function ie() {
      Y.value = true;
      let { data, error } = await S(`/data-providers/credentials/delete`, {
        method: `POST`,
        body: {
          provider_id: W,
        },
        authenticated: true,
      });
      Y.value = false;
      if (error.value || !data.value) {
        O(`error`, x(error.value, `Unable to delete the Massive API key`));
        return;
      }
      $(data.value.data);
      X.value = false;
      K.apiKey = ``;
      O(`success`, `Massive API key deleted successfully`);
    }
    async function ae() {
      J.value = true;
      let { data, error } = await S(`/data-providers/credentials/validate`, {
        method: `POST`,
        body: {
          provider_id: W,
        },
        authenticated: true,
      });
      J.value = false;
      if (error.value || !data.value) {
        O(`error`, x(error.value, `Unable to validate the Massive API key`));
        return;
      }
      O(`success`, data.value.message);
    }
    ct(() => {
      if (!G.dataProviderCredentials.length) {
        G.fetchDataProviderCredentials();
      }
    });
    return (c, l) => {
      let u = t_7;
      let v = t_8;
      let S = i;
      let C = t_4;
      let w = t_1;
      let T = t_5;
      let E = t_9;
      let W = t_6;
      let G = t_3;
      mt();
      return v_1(
        wt(e.embedded ? `div` : t_10),
        {
          class: Qn(e.embedded ? `w-full space-y-3 lg:col-span-9` : ``),
        },
        {
          default: qt(() => [
            e.embedded
              ? y(``, true)
              : (mt(),
                v_1(
                  u,
                  {
                    key: 0,
                  },
                  {
                    default: qt(() => [
                      ...(l[3] ||= [E_1(` Data Providers `, -1)]),
                    ]),
                    _: 1,
                  },
                )),
            _(
              `div`,
              {
                class: Qn(
                  e.embedded
                    ? `space-y-3`
                    : `rounded-2xl border border-gray-200 bg-gray-100/70 p-2 shadow-sm dark:border-gray-800 dark:bg-gray-950 sm:p-3`,
                ),
              },
              [
                D(
                  W,
                  {
                    title: `Massive`,
                  },
                  {
                    header: qt(() => [
                      D(
                        v,
                        {
                          color: On(Q) ? `success` : `neutral`,
                          variant: `soft`,
                          size: `xs`,
                        },
                        {
                          default: qt(() => [
                            E_1(nr(On(Q) ? `Configured` : `Not configured`), 1),
                          ]),
                          _: 1,
                        },
                        8,
                        [`color`],
                      ),
                    ]),
                    default: qt(() => [
                      _(`div`, P, [
                        _(`div`, F, [
                          (l[5] ||= _(
                            `p`,
                            null,
                            ` Connect Massive once to use its market data products across Jesse. `,
                            -1,
                          )),
                          _(`a`, I, [
                            (l[4] ||= E_1(` Open Massive `, -1)),
                            D(S, {
                              name: `i-heroicons-arrow-top-right-on-square`,
                              class: `size-4`,
                            }),
                          ]),
                        ]),
                        _(`div`, null, [
                          (l[6] ||= _(
                            `p`,
                            {
                              class: `text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400`,
                            },
                            ` Products `,
                            -1,
                          )),
                          _(`div`, L, [
                            (mt(),
                            b(
                              o,
                              null,
                              bt(d, (e) =>
                                D(
                                  v,
                                  {
                                    key: e,
                                    color: `neutral`,
                                    variant: `soft`,
                                    size: `sm`,
                                  },
                                  {
                                    default: qt(() => [E_1(nr(e), 1)]),
                                    _: 2,
                                  },
                                  1024,
                                ),
                              ),
                              64,
                            )),
                          ]),
                        ]),
                        _(`div`, R, [
                          D(S, {
                            name: `i-heroicons-shield-check`,
                            class: `mt-0.5 size-4 shrink-0 text-primary`,
                          }),
                          (l[7] ||= _(
                            `p`,
                            {
                              class: `text-xs leading-5 text-gray-600 dark:text-gray-300`,
                            },
                            ` The saved key stays in your Jesse database and is never returned to the Dashboard after saving. `,
                            -1,
                          )),
                        ]),
                        On(Q)
                          ? (mt(),
                            b(`div`, z, [
                              _(`div`, B, [
                                D(S, {
                                  name: `i-heroicons-check-circle`,
                                  class: `size-5 shrink-0 text-success`,
                                }),
                                _(`div`, null, [
                                  (l[8] ||= _(
                                    `p`,
                                    {
                                      class: `text-sm font-medium text-gray-800 dark:text-gray-200`,
                                    },
                                    `API key added`,
                                    -1,
                                  )),
                                  On(Z)?.created_at
                                    ? (mt(), b(`p`, V, nr(On(ne)), 1))
                                    : y(``, true),
                                ]),
                              ]),
                              _(`div`, H, [
                                D(
                                  C,
                                  {
                                    type: `button`,
                                    color: `neutral`,
                                    variant: `outline`,
                                    icon: `i-heroicons-signal`,
                                    label: `Test key`,
                                    loading: On(J),
                                    class: `justify-center sm:shrink-0`,
                                    onClick: ae,
                                  },
                                  null,
                                  8,
                                  [`loading`],
                                ),
                                D(C, {
                                  type: `button`,
                                  color: `error`,
                                  variant: `ghost`,
                                  icon: `i-heroicons-trash`,
                                  label: `Delete key`,
                                  class: `justify-center sm:shrink-0`,
                                  onClick: (l[0] ||= (e) => (X.value = true)),
                                }),
                              ]),
                            ]))
                          : y(``, true),
                        On(Q)
                          ? y(``, true)
                          : (mt(),
                            v_1(
                              E,
                              {
                                key: 1,
                                state: On(K),
                                class: `space-y-4`,
                                onSubmit,
                              },
                              {
                                default: qt(() => [
                                  D(
                                    T,
                                    {
                                      label: `API Key`,
                                      required: ``,
                                    },
                                    {
                                      default: qt(() => [
                                        D(
                                          w,
                                          {
                                            modelValue: On(K).apiKey,
                                            "onUpdate:modelValue": (l[1] ||= (
                                              e,
                                            ) => (On(K).apiKey = e)),
                                            type: `password`,
                                            autocomplete: `new-password`,
                                            "aria-label": `Massive API key`,
                                            placeholder: `Enter your Massive API key`,
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
                                  _(`div`, U, [
                                    D(
                                      C,
                                      {
                                        type: `submit`,
                                        icon: `i-heroicons-key`,
                                        label: `Save API key`,
                                        loading: On(q),
                                        disabled: !On(K).apiKey.trim(),
                                        class: `justify-center sm:min-w-44`,
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
                            )),
                      ]),
                    ]),
                    _: 1,
                  },
                ),
              ],
              2,
            ),
            D(
              G,
              {
                modelValue: On(X),
                "onUpdate:modelValue": (l[2] ||= (e) => {
                  if (un(X)) {
                    return (X.value = e);
                  }
                  return null;
                }),
                title: `Delete Massive API Key`,
                description: `Massive imports will remain unavailable until another API key is saved.`,
                type: `danger`,
              },
              {
                default: qt(() => [
                  D(
                    C,
                    {
                      color: `error`,
                      variant: `solid`,
                      label: `Delete API key`,
                      loading: On(Y),
                      class: `sm:w-auto`,
                      block: ``,
                      onClick: ie,
                    },
                    null,
                    8,
                    [`loading`],
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
        8,
        [`class`],
      );
    };
  },
});
export const n = n_1({
  default: () => t,
});
