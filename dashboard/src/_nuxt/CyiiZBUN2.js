import { n as n_1 } from "./QTnfLwEv.js";
import {
  D,
  E as E_1,
  On,
  Qn,
  _ as __1,
  b as b_1,
  bt,
  g,
  gn,
  k,
  mt,
  nr,
  o,
  qt,
  un,
  v,
  vn,
  wt,
  y,
} from "./CoKk4mC0.js";
import { Jt } from "./Cd-sGgPF.js";
import { t as t_1 } from "./2k_QeT3T.js";
import { D as D_2, O, S, t as t_2 } from "./B8_r5oP7.js";
import { r } from "./BpBaBBm3.js";
import { h } from "./DPJPAjQR.js";
import { t as t_3 } from "./atteXEGs.js";
import { t as t_4 } from "./OaeI3Ulg.js";
import { t as t_5 } from "./Cf85K_3V.js";
import { i as i_1, t as t_6 } from "./CJNUlr67.js";
import { t as t_7 } from "./BG8CfSEZ2.js";
import { t as t_8 } from "./JgXkd7uo2.js";
import { t as t_9 } from "./DEJw_qiA2.js";
import { t as t_10 } from "./B4Wc4BFL2.js";
import { t as t_11 } from "./TtSlr_h_2.js";
import { t as t_12 } from "./CUL-_UXV2.js";
import { t as t_13 } from "./DKSmMEZa2.js";
import { t as t_14 } from "./D1yN6wZY2.js";
const A = {
  class: `px-4 py-4 transition-colors hover:bg-gray-50/70 dark:hover:bg-gray-800/40 sm:px-5`,
};
const j = {
  class: `flex items-start justify-between gap-3`,
};
const M = {
  class: `min-w-0`,
};
const N = {
  class: `flex flex-wrap items-center gap-2`,
};
const P = {
  class: `truncate text-sm font-semibold text-gray-900 dark:text-white`,
};
const F = {
  class: `mt-1 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400`,
};
const I = {
  class: `mt-4 grid gap-2 sm:grid-cols-2`,
};
const L = {
  class: `rounded-lg bg-gray-50 px-3 py-2.5 dark:bg-gray-800/60`,
};
const R = {
  class: `text-xs font-medium text-gray-500 dark:text-gray-400`,
};
const z = {
  class: `mt-1 break-all font-mono text-xs text-gray-800 dark:text-gray-200`,
};
const B = {
  class: `rounded-lg bg-gray-50 px-3 py-2.5 dark:bg-gray-800/60`,
};
const V = {
  class: `text-xs font-medium text-gray-500 dark:text-gray-400`,
};
const H = {
  class: `mt-1 break-all font-mono text-xs text-gray-800 dark:text-gray-200`,
};
const U = {
  key: 0,
  class: `rounded-lg bg-gray-50 px-3 py-2.5 dark:bg-gray-800/60`,
};
const W = {
  class: `mt-1 font-mono text-xs text-gray-800 dark:text-gray-200`,
};
const G = {
  class: `rounded-lg bg-gray-50 px-3 py-2.5 dark:bg-gray-800/60`,
};
const K = {
  class: `mt-1 break-all font-mono text-xs text-gray-800 dark:text-gray-200`,
};
const q = {
  class: `rounded-lg bg-gray-50 px-3 py-2.5 dark:bg-gray-800/60`,
};
const J = {
  class: `mt-1 break-all font-mono text-xs text-gray-800 dark:text-gray-200`,
};
const Y = {
  class: `rounded-lg bg-gray-50 px-3 py-2.5 dark:bg-gray-800/60`,
};
const X = {
  class: `mt-1 break-all font-mono text-xs text-gray-800 dark:text-gray-200`,
};
const de = Object.assign(
  k({
    __name: `ExchangeApiKey`,
    props: {
      apiKey: {},
    },
    setup(e) {
      let i = e;
      let s = vn(false);
      let c = vn(false);
      let l = t_2();
      async function u() {
        c.value = true;
        let { data, error } = await S(`/exchange/api-keys/delete`, {
          method: `POST`,
          body: {
            id: i.apiKey.id,
          },
          authenticated: true,
        });
        c.value = false;
        if (error.value && error.value.statusCode !== 200) {
          D_2(error);
          return;
        }
        s.value = false;
        O(`success`, `API Key deleted successfully`);
        l.exchangeApiKeys = l.exchangeApiKeys.filter(
          (e) => e.id !== i.apiKey.id,
        );
      }
      return (i, l) => {
        let g = t_10;
        let _ = i_1;
        let v = t_6;
        let b = t_3;
        mt();
        return b_1(`article`, A, [
          __1(`div`, j, [
            __1(`div`, M, [
              __1(`div`, N, [
                __1(`h3`, P, nr(e.apiKey.name), 1),
                D(
                  g,
                  {
                    color: `neutral`,
                    variant: `soft`,
                    size: `xs`,
                  },
                  {
                    default: qt(() => [E_1(nr(e.apiKey.exchange), 1)]),
                    _: 1,
                  },
                ),
              ]),
              __1(`p`, F, [
                D(_, {
                  name: `i-heroicons-clock`,
                  class: `size-3.5`,
                }),
                E_1(` ` + nr(On(h)(e.apiKey.created_at).value), 1),
              ]),
            ]),
            D(v, {
              icon: `i-heroicons-trash`,
              color: `error`,
              label: `Delete`,
              variant: `ghost`,
              size: `xs`,
              onClick: (l[0] ||= (e) => (s.value = true)),
            }),
          ]),
          __1(`dl`, I, [
            __1(`div`, L, [
              __1(
                `dt`,
                R,
                nr(
                  e.apiKey.exchange.startsWith(`Lighter`)
                    ? `L1 Wallet Address`
                    : e.apiKey.exchange.includes(`Hyperliquid`)
                      ? `Wallet Address`
                      : `API Key`,
                ),
                1,
              ),
              __1(`dd`, z, nr(e.apiKey.api_key), 1),
            ]),
            __1(`div`, B, [
              __1(
                `dt`,
                V,
                nr(
                  e.apiKey.exchange.startsWith(`Lighter`)
                    ? `API Private Key`
                    : e.apiKey.exchange.includes(`Hyperliquid`)
                      ? `Private Key`
                      : `API Secret`,
                ),
                1,
              ),
              __1(`dd`, H, nr(e.apiKey.api_secret), 1),
            ]),
            e.apiKey.exchange.startsWith(`Lighter`)
              ? (mt(),
                b_1(`div`, U, [
                  (l[2] ||= __1(
                    `dt`,
                    {
                      class: `text-xs font-medium text-gray-500 dark:text-gray-400`,
                    },
                    `API Key Index`,
                    -1,
                  )),
                  __1(`dd`, W, nr(e.apiKey.api_key_index), 1),
                ]))
              : y(``, true),
            e.apiKey.exchange.startsWith(`Apex`)
              ? (mt(),
                b_1(
                  o,
                  {
                    key: 1,
                  },
                  [
                    __1(`div`, G, [
                      (l[3] ||= __1(
                        `dt`,
                        {
                          class: `text-xs font-medium text-gray-500 dark:text-gray-400`,
                        },
                        `API Passphrase`,
                        -1,
                      )),
                      __1(`dd`, K, nr(e.apiKey.api_passphrase), 1),
                    ]),
                    __1(`div`, q, [
                      (l[4] ||= __1(
                        `dt`,
                        {
                          class: `text-xs font-medium text-gray-500 dark:text-gray-400`,
                        },
                        `Wallet Address`,
                        -1,
                      )),
                      __1(`dd`, J, nr(e.apiKey.wallet_address), 1),
                    ]),
                    __1(`div`, Y, [
                      (l[5] ||= __1(
                        `dt`,
                        {
                          class: `text-xs font-medium text-gray-500 dark:text-gray-400`,
                        },
                        `Omni/Stark Key`,
                        -1,
                      )),
                      __1(`dd`, X, nr(e.apiKey.stark_private_key), 1),
                    ]),
                  ],
                  64,
                ))
              : y(``, true),
          ]),
          D(
            b,
            {
              modelValue: On(s),
              "onUpdate:modelValue": (l[1] ||= (e) => {
                if (un(s)) {
                  return (s.value = e);
                }
                return null;
              }),
              title: `Delete API Key`,
              description: `Are you sure you want to delete '${e.apiKey.name}' API key?`,
              type: `info`,
            },
            {
              default: qt(() => [
                D(
                  v,
                  {
                    variant: `solid`,
                    color: `error`,
                    block: ``,
                    class: `sm:w-auto`,
                    label: `Delete`,
                    loading: On(c),
                    onClick: u,
                  },
                  null,
                  8,
                  [`loading`],
                ),
              ]),
              _: 1,
            },
            8,
            [`modelValue`, `description`],
          ),
        ]);
      };
    },
  }),
  {
    __name: `ExchangeApiKey`,
  },
);
const fe = {
  class: `flex shrink-0 gap-2`,
};
const pe = {
  class: `mt-4 flex items-start gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 dark:border-gray-700 dark:bg-gray-800/60`,
};
const me = {
  class: `flex justify-end`,
};
const he = {
  key: 0,
  class: `p-4`,
};
const ge = {
  key: 1,
  class: `divide-y divide-gray-100 dark:divide-gray-800`,
};
const _e = {
  class: `flex items-center gap-2`,
};
const ve = {
  class: `space-y-4`,
};
const ye = {
  class: `border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center hover:border-primary-400 dark:hover:border-primary-600 transition-colors`,
};
const be = {
  for: `csv-file`,
  class: `cursor-pointer flex flex-col items-center gap-3`,
};
const xe = {
  class: `text-sm font-medium text-gray-700 dark:text-gray-300`,
};
const Se = {
  class: `flex justify-end gap-3`,
};
export const t = k({
  __name: `exchange-api-keys`,
  props: {
    embedded: {
      type: Boolean,
      default: false,
    },
  },
  setup(e) {
    if (!e.embedded) {
      r({
        title: `Exchange API Keys`,
      });
    }
    let u = vn(false);
    let E = t_2();
    let A = gn({
      exchange: E.liveTradingExchangeNames[0],
      name: ``,
      apiKey: ``,
      apiSecret: ``,
      apiPassphrase: ``,
      walletAddress: ``,
      stark_private_key: ``,
      apiKeyIndex: ``,
    });
    let j = g(() => E.exchangeApiKeys);
    let M = g(() => A.exchange.startsWith(`Apex`));
    let N = g(() => A.exchange.toLowerCase().includes(`kucoin`));
    let P = g(() => M.value || N.value);
    let F = g(() => A.exchange.startsWith(`Lighter`));
    let I = g(() => A.exchange.includes(`Hyperliquid`));
    let L = g(() => {
      if (F.value) {
        return `L1 Wallet Address:`;
      }
      if (I.value) {
        return `Wallet Address`;
      }
      return `API Key:`;
    });
    let R = g(() => {
      if (F.value) {
        return `Your Ethereum/L1 wallet address (0x123...)`;
      }
      if (I.value) {
        return `Enter your wallet address here (0x123...)`;
      }
      return `Enter your API key here`;
    });
    let z = g(() => {
      if (F.value) {
        return `API Private Key:`;
      }
      if (I.value) {
        return `Private Key`;
      }
      return `API Secret:`;
    });
    let B = g(() => {
      if (F.value) {
        return `Enter your Lighter API private key here`;
      }
      if (I.value) {
        return `Enter your private key here`;
      }
      return `Enter your API secret here`;
    });
    let V = vn(false);
    let H = vn(false);
    let U = vn(false);
    let W = vn(null);
    let G = vn(false);
    let K = vn(``);
    let q = gn({
      password: ``,
    });
    let J = g(() => {
      if (M.value) {
        return (
          A.exchange &&
          A.apiKey &&
          A.apiSecret &&
          A.apiPassphrase &&
          A.walletAddress &&
          A.stark_private_key
        );
      }
      if (N.value) {
        return A.exchange && A.apiKey && A.apiSecret && A.apiPassphrase;
      }
      if (F.value) {
        return A.exchange && A.apiKey && A.apiSecret && A.apiKeyIndex;
      }
      return A.exchange && A.apiKey && A.apiSecret;
    });
    async function onSubmit() {
      if (!J.value) {
        O(`error`, `Please fill in all required fields`);
        return;
      }
      u.value = true;
      let e = {
        name: A.name,
        exchange: A.exchange,
        api_key: A.apiKey,
        api_secret: A.apiSecret,
      };
      if (M.value) {
        e.additional_fields = {
          api_passphrase: A.apiPassphrase,
          wallet_address: A.walletAddress,
          stark_private_key: A.stark_private_key,
        };
      } else if (N.value) {
        e.additional_fields = {
          api_passphrase: A.apiPassphrase,
        };
      }
      if (F.value) {
        e.additional_fields = {
          api_key_index: A.apiKeyIndex,
        };
      }
      let { data, error } = await S(`/exchange/api-keys/store`, {
        method: `POST`,
        body: e,
        authenticated: true,
      });
      u.value = false;
      if (error.value && error.value.statusCode !== 200) {
        D_2(error);
      }
      let data_value = data.value;
      if (data_value.status === `success`) {
        O(`success`, `Successfully added API key`);
        j.value.push(data_value.data);
        Ce();
      } else if (data_value.status === `error`) {
        O(`error`, data_value.message);
      }
    }
    async function X() {
      if (!q.password) {
        O(`error`, `Please fill password!`);
        return;
      }
      G.value = true;
      try {
        let { data: e, error: t } = await S(`/download/download-api-keys`, {
          method: `POST`,
          body: {
            password: q.password,
          },
          authenticated: true,
          responseType: `blob`,
        });
        if (t?.value) {
          if (t.value.statusCode === 401) {
            O(`error`, `Incorrect password`);
          } else {
            O(`error`, t.value.data?.message || `Failed to download API keys`);
          }
          G.value = false;
          return;
        }
        let n = t.value?.data?.headers?.get(`Content-Disposition`);
        let r = `api-keys.csv`;
        if (n) {
          let e = n.match(/filename="?(.+)"?/i);
          if (e && e[1]) {
            r = decodeURIComponent(e[1].replace(/['"]/g, ``));
          }
        }
        if (!e.value) {
          O(`error`, `The API key export was empty`);
          return;
        }
        let i = window.URL.createObjectURL(e.value);
        let a = document.createElement(`a`);
        a.href = i;
        a.download = r;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(i);
        document.body.removeChild(a);
        O(`success`, `API keys downloaded successfully`);
        V.value = false;
        q.password = ``;
      } catch (e) {
        O(`error`, `Failed to download API keys: ${e.message}`);
      } finally {
        G.value = false;
      }
    }
    async function onChange(e) {
      let t = e.target.files?.[0];
      if (t && t.type === `text/csv`) {
        K.value = t.name;
        W.value = await t.text();
      } else {
        alert(`Please select a valid CSV file`);
      }
    }
    async function Q() {
      if (W.value) {
        U.value = true;
        try {
          let { data: e, error: t } = await S(`/download/import-api-keys`, {
            method: `POST`,
            body: {
              content: W.value,
            },
            authenticated: true,
          });
          if (t.value) {
            O(`error`, t.value);
            return;
          }
          E.fetchExchangeApiKeys();
          let n = e.value;
          if (n.success) {
            O(`success`, `${n.imported_count} API keys imported successfully`);
            H.value = false;
            $();
            return;
          }
          O(`error`, n.error);
        } catch (e) {
          O(`error`, e);
        } finally {
          U.value = false;
        }
      }
    }
    function $() {
      W.value = null;
      K.value = ``;
    }
    function Ce() {
      A.exchange = E.liveTradingExchangeNames[0];
      A.name = ``;
      A.apiKey = ``;
      A.apiSecret = ``;
      A.apiPassphrase = ``;
      A.walletAddress = ``;
      A.stark_private_key = ``;
      A.apiKeyIndex = ``;
    }
    return (c, l) => {
      let _ = t_9;
      let x = t_6;
      let S = i_1;
      let C = t_5;
      let w = t_7;
      let T = t_1;
      let N = t_11;
      let I = t_8;
      let Ce = t_10;
      let we = t_13;
      let Te = t_3;
      let Ee = t_14;
      let De = t_4;
      mt();
      return v(
        wt(e.embedded ? `div` : t_12),
        {
          class: Qn(e.embedded ? `w-full space-y-3 lg:col-span-9` : ``),
        },
        {
          default: qt(() => [
            __1(
              `div`,
              {
                class: Qn(
                  e.embedded
                    ? `flex items-center justify-end gap-2`
                    : `mb-4 flex items-center justify-between gap-3`,
                ),
              },
              [
                e.embedded
                  ? y(``, true)
                  : (mt(),
                    v(
                      _,
                      {
                        key: 0,
                      },
                      {
                        default: qt(() => [
                          ...(l[15] ||= [E_1(` Exchange API Keys `, -1)]),
                        ]),
                        _: 1,
                      },
                    )),
                __1(`div`, fe, [
                  D(x, {
                    icon: `i-heroicons-arrow-down-tray`,
                    color: `neutral`,
                    variant: `outline`,
                    size: `sm`,
                    label: `Export`,
                    onClick: (l[0] ||= (e) => (V.value = true)),
                  }),
                  D(x, {
                    icon: `i-heroicons-arrow-up-tray`,
                    color: `neutral`,
                    variant: `outline`,
                    size: `sm`,
                    label: `Import`,
                    onClick: (l[1] ||= (e) => (H.value = true)),
                  }),
                ]),
              ],
              2,
            ),
            __1(
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
                  I,
                  {
                    title: `Add API key`,
                  },
                  {
                    default: qt(() => [
                      (l[17] ||= __1(
                        `p`,
                        {
                          class: `text-sm text-gray-600 dark:text-gray-300`,
                        },
                        ` Here you can add your API keys for various exchanges. API keys are used to connect your account to the exchange and allow the bot to trade on your behalf. `,
                        -1,
                      )),
                      __1(`div`, pe, [
                        D(S, {
                          name: `i-heroicons-shield-check`,
                          class: `mt-0.5 size-4 shrink-0 text-primary`,
                        }),
                        (l[16] ||= __1(
                          `p`,
                          {
                            class: `text-xs leading-5 text-gray-600 dark:text-gray-300`,
                          },
                          ` For security reasons, API keys cannot be modified or viewed again after they are created. `,
                          -1,
                        )),
                      ]),
                      D(
                        N,
                        {
                          state: On(A),
                          class: `mt-5 space-y-4`,
                          onSubmit,
                        },
                        {
                          default: qt(() => [
                            D(
                              w,
                              {
                                label: `Exchange name:`,
                                required: ``,
                              },
                              {
                                default: qt(() => [
                                  D(
                                    C,
                                    {
                                      modelValue: On(A).exchange,
                                      "onUpdate:modelValue": (l[2] ||= (e) =>
                                        (On(A).exchange = e)),
                                      items: On(E).liveTradingExchangeNames,
                                    },
                                    null,
                                    8,
                                    [`modelValue`, `items`],
                                  ),
                                ]),
                                _: 1,
                              },
                            ),
                            D(
                              w,
                              {
                                label: `Name:`,
                                required: ``,
                              },
                              {
                                default: qt(() => [
                                  D(
                                    T,
                                    {
                                      modelValue: On(A).name,
                                      "onUpdate:modelValue": (l[3] ||= (e) =>
                                        (On(A).name = e)),
                                      type: `text`,
                                      placeholder: `Give a name to this API key (e.g. subaccount1)`,
                                    },
                                    null,
                                    8,
                                    [`modelValue`],
                                  ),
                                ]),
                                _: 1,
                              },
                            ),
                            D(
                              w,
                              {
                                label: On(L),
                                required: ``,
                              },
                              {
                                default: qt(() => [
                                  D(
                                    T,
                                    {
                                      modelValue: On(A).apiKey,
                                      "onUpdate:modelValue": (l[4] ||= (e) =>
                                        (On(A).apiKey = e)),
                                      placeholder: On(R),
                                      type: `text`,
                                    },
                                    null,
                                    8,
                                    [`modelValue`, `placeholder`],
                                  ),
                                ]),
                                _: 1,
                              },
                              8,
                              [`label`],
                            ),
                            D(
                              w,
                              {
                                label: On(z),
                                required: ``,
                              },
                              {
                                default: qt(() => [
                                  D(
                                    T,
                                    {
                                      modelValue: On(A).apiSecret,
                                      "onUpdate:modelValue": (l[5] ||= (e) =>
                                        (On(A).apiSecret = e)),
                                      placeholder: On(B),
                                      type: `text`,
                                    },
                                    null,
                                    8,
                                    [`modelValue`, `placeholder`],
                                  ),
                                ]),
                                _: 1,
                              },
                              8,
                              [`label`],
                            ),
                            On(F)
                              ? (mt(),
                                v(
                                  w,
                                  {
                                    key: 0,
                                    label: `API Key Index:`,
                                    required: ``,
                                  },
                                  {
                                    default: qt(() => [
                                      D(
                                        T,
                                        {
                                          modelValue: On(A).apiKeyIndex,
                                          "onUpdate:modelValue": (l[6] ||= (
                                            e,
                                          ) => (On(A).apiKeyIndex = e)),
                                          placeholder: `Your API key index (integer, e.g. 2)`,
                                          type: `text`,
                                        },
                                        null,
                                        8,
                                        [`modelValue`],
                                      ),
                                    ]),
                                    _: 1,
                                  },
                                ))
                              : y(``, true),
                            On(P)
                              ? (mt(),
                                v(
                                  w,
                                  {
                                    key: 1,
                                    label: `API Passphrase:`,
                                    required: ``,
                                  },
                                  {
                                    default: qt(() => [
                                      D(
                                        T,
                                        {
                                          modelValue: On(A).apiPassphrase,
                                          "onUpdate:modelValue": (l[7] ||= (
                                            e,
                                          ) => (On(A).apiPassphrase = e)),
                                          placeholder: `Enter your API passphrase here`,
                                          type: `text`,
                                        },
                                        null,
                                        8,
                                        [`modelValue`],
                                      ),
                                    ]),
                                    _: 1,
                                  },
                                ))
                              : y(``, true),
                            On(M)
                              ? (mt(),
                                v(
                                  w,
                                  {
                                    key: 2,
                                    label: `Wallet Address:`,
                                    required: ``,
                                  },
                                  {
                                    default: qt(() => [
                                      D(
                                        T,
                                        {
                                          modelValue: On(A).walletAddress,
                                          "onUpdate:modelValue": (l[8] ||= (
                                            e,
                                          ) => (On(A).walletAddress = e)),
                                          placeholder: `Enter your wallet address here`,
                                          type: `text`,
                                        },
                                        null,
                                        8,
                                        [`modelValue`],
                                      ),
                                    ]),
                                    _: 1,
                                  },
                                ))
                              : y(``, true),
                            On(M)
                              ? (mt(),
                                v(
                                  w,
                                  {
                                    key: 3,
                                    label: `Omni/Stark Key:`,
                                    required: ``,
                                  },
                                  {
                                    default: qt(() => [
                                      D(
                                        T,
                                        {
                                          modelValue: On(A).stark_private_key,
                                          "onUpdate:modelValue": (l[9] ||= (
                                            e,
                                          ) => (On(A).stark_private_key = e)),
                                          placeholder: `Enter your Omni key (for Apex Omni) or Stark key (for Apex Pro) here`,
                                          type: `text`,
                                        },
                                        null,
                                        8,
                                        [`modelValue`],
                                      ),
                                    ]),
                                    _: 1,
                                  },
                                ))
                              : y(``, true),
                            __1(`div`, me, [
                              D(
                                x,
                                {
                                  type: `submit`,
                                  icon: `i-heroicons-plus`,
                                  class: `flex w-full justify-center sm:w-48`,
                                  label: `Create`,
                                  loading: On(u),
                                  disabled: !On(J),
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
                    ]),
                    _: 1,
                  },
                ),
                D(
                  I,
                  {
                    title: `Saved API keys`,
                    flush: ``,
                    "overflow-hidden": ``,
                    class: `mt-3`,
                  },
                  {
                    header: qt(() => [
                      D(
                        Ce,
                        {
                          color: `neutral`,
                          variant: `soft`,
                          size: `xs`,
                        },
                        {
                          default: qt(() => [E_1(nr(On(j).length), 1)]),
                          _: 1,
                        },
                      ),
                    ]),
                    default: qt(() => [
                      On(j).length
                        ? (mt(),
                          b_1(`div`, ge, [
                            (mt(true),
                            b_1(
                              o,
                              null,
                              bt(On(j), (e) => {
                                mt();
                                return v(
                                  de,
                                  {
                                    key: e.id,
                                    "api-key": e,
                                  },
                                  null,
                                  8,
                                  [`api-key`],
                                );
                              }),
                              128,
                            )),
                          ]))
                        : (mt(),
                          b_1(`div`, he, [
                            D(we, null, {
                              default: qt(() => [
                                ...(l[18] ||= [
                                  E_1(` No API keys added yet `, -1),
                                ]),
                              ]),
                              _: 1,
                            }),
                          ])),
                    ]),
                    _: 1,
                  },
                ),
              ],
              2,
            ),
            D(
              Te,
              {
                modelValue: On(V),
                "onUpdate:modelValue": (l[11] ||= (e) => {
                  if (un(V)) {
                    return (V.value = e);
                  }
                  return null;
                }),
                title: `Export API Keys`,
                type: `warning`,
                description: `You are about to export all your exchange API keys to a CSV file. This file will contain sensitive credentials in plain text. Please enter your password to confirm.`,
              },
              {
                fields: qt(() => [
                  D(
                    w,
                    {
                      label: `Password`,
                      required: ``,
                      class: `mt-2`,
                    },
                    {
                      default: qt(() => [
                        D(
                          T,
                          {
                            modelValue: On(q).password,
                            "onUpdate:modelValue": (l[10] ||= (e) =>
                              (On(q).password = e)),
                            type: `password`,
                            placeholder: `Enter your password`,
                            class: `w-full`,
                            onKeyup: Jt(X, [`enter`]),
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
                default: qt(() => [
                  D(
                    x,
                    {
                      variant: `solid`,
                      color: `primary`,
                      block: ``,
                      class: `sm:w-auto`,
                      label: `Export API Keys`,
                      loading: On(G),
                      disabled: !On(q).password,
                      onClick: X,
                    },
                    null,
                    8,
                    [`loading`, `disabled`],
                  ),
                ]),
                _: 1,
              },
              8,
              [`modelValue`],
            ),
            D(
              De,
              {
                open: On(H),
                "onUpdate:open": [
                  (l[13] ||= (e) => {
                    if (un(H)) {
                      return (H.value = e);
                    }
                    return null;
                  }),
                  (l[14] ||= (e) => {
                    if (!e) {
                      $();
                    }
                  }),
                ],
              },
              {
                content: qt(() => [
                  D(Ee, null, {
                    header: qt(() => [
                      __1(`div`, _e, [
                        D(S, {
                          name: `i-heroicons-arrow-up-tray`,
                          class: `w-5 h-5`,
                        }),
                        (l[19] ||= __1(
                          `h3`,
                          {
                            class: `text-lg font-semibold`,
                          },
                          `Import API Keys from CSV`,
                          -1,
                        )),
                      ]),
                    ]),
                    footer: qt(() => [
                      __1(`div`, Se, [
                        D(x, {
                          color: `neutral`,
                          variant: `ghost`,
                          label: `Cancel`,
                          onClick: (l[12] ||= (e) => {
                            H.value = false;
                            $();
                          }),
                        }),
                        D(
                          x,
                          {
                            icon: `i-heroicons-arrow-up-tray`,
                            color: `primary`,
                            label: `Import API Keys`,
                            loading: On(U),
                            disabled: !On(W),
                            onClick: Q,
                          },
                          null,
                          8,
                          [`loading`, `disabled`],
                        ),
                      ]),
                    ]),
                    default: qt(() => [
                      __1(`div`, ve, [
                        (l[22] ||= __1(
                          `p`,
                          {
                            class: `text-sm text-gray-600 dark:text-gray-400`,
                          },
                          ` Select a CSV file containing your API keys. `,
                          -1,
                        )),
                        __1(`div`, ye, [
                          __1(
                            `input`,
                            {
                              id: `csv-file`,
                              type: `file`,
                              class: `hidden`,
                              accept: `.csv`,
                              onChange,
                            },
                            null,
                            32,
                          ),
                          __1(`label`, be, [
                            D(S, {
                              name: `i-heroicons-document-arrow-up`,
                              class: `w-12 h-12 text-gray-400`,
                            }),
                            __1(`div`, null, [
                              __1(
                                `p`,
                                xe,
                                nr(
                                  On(W) ? On(K) : `Click to select a CSV file`,
                                ),
                                1,
                              ),
                              (l[20] ||= __1(
                                `p`,
                                {
                                  class: `text-xs text-gray-500 dark:text-gray-400 mt-1`,
                                },
                                ` or drag and drop `,
                                -1,
                              )),
                            ]),
                          ]),
                          On(W)
                            ? (mt(),
                              v(
                                x,
                                {
                                  key: 0,
                                  icon: `i-heroicons-x-mark`,
                                  color: `error`,
                                  variant: `soft`,
                                  size: `xs`,
                                  class: `mt-3`,
                                  onClick: $,
                                },
                                {
                                  default: qt(() => [
                                    ...(l[21] ||= [E_1(` Clear file `, -1)]),
                                  ]),
                                  _: 1,
                                },
                              ))
                            : y(``, true),
                        ]),
                      ]),
                    ]),
                    _: 1,
                  }),
                ]),
                _: 1,
              },
              8,
              [`open`],
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
