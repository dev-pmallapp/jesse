import {
  $,
  D,
  E,
  Ft,
  Lt,
  On,
  Qn,
  _,
  b,
  er,
  et,
  g,
  jt,
  k,
  mt,
  nr,
  qt,
  v,
  wn,
  xt,
  y,
  z,
} from "./CoKk4mC0.js";
import { i, n as n_1, u } from "./2k_QeT3T.js";
import { U as U_1 } from "./B8_r5oP7.js";
import { c } from "./CioJR-lb.js";
import { n as n_2 } from "./DPJPAjQR.js";
import {
  a,
  c as c_2,
  d,
  f,
  i as i_2,
  n as n_3,
  o,
  r as r_1,
  s,
  u as u_2,
} from "./OaeI3Ulg.js";
import { a as a_2, h, t as t_1, v as v_2, y as y_2 } from "./CJNUlr67.js";
import { t as t_2 } from "./D1yN6wZY2.js";
const extend = {
  slots: {
    overlay: `fixed inset-0 bg-elevated/75`,
    content: `fixed bg-default divide-y divide-default sm:ring ring-default sm:shadow-lg flex flex-col focus:outline-none`,
    header: `flex items-center gap-1.5 p-4 sm:px-6 min-h-(--ui-header-height)`,
    wrapper: ``,
    body: `flex-1 overflow-y-auto p-4 sm:p-6`,
    footer: `flex items-center gap-1.5 p-4 sm:px-6`,
    title: `text-highlighted font-semibold`,
    description: `mt-1 text-muted text-sm`,
    close: `absolute top-4 end-4`,
  },
  variants: {
    side: {
      top: {
        content: ``,
      },
      right: {
        content: `max-w-md`,
      },
      bottom: {
        content: ``,
      },
      left: {
        content: `max-w-md`,
      },
    },
    inset: {
      true: {
        content: `rounded-lg`,
      },
    },
    transition: {
      true: {
        overlay: `data-[state=open]:animate-[fade-in_200ms_ease-out] data-[state=closed]:animate-[fade-out_200ms_ease-in]`,
      },
    },
  },
  compoundVariants: [
    {
      side: `top`,
      inset: true,
      class: {
        content: `max-h-[calc(100%-2rem)] inset-x-4 top-4`,
      },
    },
    {
      side: `top`,
      inset: false,
      class: {
        content: `max-h-full inset-x-0 top-0`,
      },
    },
    {
      side: `right`,
      inset: true,
      class: {
        content: `w-[calc(100%-2rem)] inset-y-4 right-4`,
      },
    },
    {
      side: `right`,
      inset: false,
      class: {
        content: `w-full inset-y-0 right-0`,
      },
    },
    {
      side: `bottom`,
      inset: true,
      class: {
        content: `max-h-[calc(100%-2rem)] inset-x-4 bottom-4`,
      },
    },
    {
      side: `bottom`,
      inset: false,
      class: {
        content: `max-h-full inset-x-0 bottom-0`,
      },
    },
    {
      side: `left`,
      inset: true,
      class: {
        content: `w-[calc(100%-2rem)] inset-y-4 left-4`,
      },
    },
    {
      side: `left`,
      inset: false,
      class: {
        content: `w-full inset-y-0 left-0`,
      },
    },
    {
      transition: true,
      side: `top`,
      class: {
        content: `data-[state=open]:animate-[slide-in-from-top_200ms_ease-in-out] data-[state=closed]:animate-[slide-out-to-top_200ms_ease-in-out]`,
      },
    },
    {
      transition: true,
      side: `right`,
      class: {
        content: `data-[state=open]:animate-[slide-in-from-right_200ms_ease-in-out] data-[state=closed]:animate-[slide-out-to-right_200ms_ease-in-out]`,
      },
    },
    {
      transition: true,
      side: `bottom`,
      class: {
        content: `data-[state=open]:animate-[slide-in-from-bottom_200ms_ease-in-out] data-[state=closed]:animate-[slide-out-to-bottom_200ms_ease-in-out]`,
      },
    },
    {
      transition: true,
      side: `left`,
      class: {
        content: `data-[state=open]:animate-[slide-in-from-left_200ms_ease-in-out] data-[state=closed]:animate-[slide-out-to-left_200ms_ease-in-out]`,
      },
    },
  ],
};
const G = {
  __name: `USlideover`,
  props: {
    title: {
      type: String,
      required: false,
    },
    description: {
      type: String,
      required: false,
    },
    content: {
      type: Object,
      required: false,
    },
    overlay: {
      type: Boolean,
      required: false,
      default: true,
    },
    transition: {
      type: Boolean,
      required: false,
      default: true,
    },
    side: {
      type: null,
      required: false,
      default: `right`,
    },
    inset: {
      type: Boolean,
      required: false,
    },
    portal: {
      type: [Boolean, String],
      required: false,
      skipCheck: true,
      default: true,
    },
    close: {
      type: [Boolean, Object],
      required: false,
      default: true,
    },
    closeIcon: {
      type: null,
      required: false,
    },
    dismissible: {
      type: Boolean,
      required: false,
      default: true,
    },
    class: {
      type: null,
      required: false,
    },
    ui: {
      type: Object,
      required: false,
    },
    open: {
      type: Boolean,
      required: false,
    },
    defaultOpen: {
      type: Boolean,
      required: false,
    },
    modal: {
      type: Boolean,
      required: false,
      default: true,
    },
    unmountOnHide: {
      type: Boolean,
      required: false,
    },
  },
  emits: [
    `leave`,
    `after:leave`,
    `enter`,
    `after:enter`,
    `close:prevent`,
    `update:open`,
  ],
  setup(e, { emit }) {
    let p = e;
    let C = emit;
    let j = Lt();
    let U = y_2(`slideover`, p);
    let { t: t_2 } = n_2();
    let K = c();
    let q = v_2(U_1(U, `open`, `defaultOpen`, `modal`, `unmountOnHide`), C);
    let J = i(wn(() => U.portal));
    let Y = wn(() => U.content);
    let X = g(() => {
      if (U.dismissible) {
        return {
          pointerDownOutside: n_3,
        };
      }
      return [`interactOutside`, `escapeKeyDown`].reduce((e, t) => {
        e[t] = (e) => {
          e.preventDefault();
          C(`close:prevent`);
        };
        return e;
      }, {});
    });
    let Z = g(() =>
      a_2({
        extend,
        ...(K.ui?.slideover || {}),
      })({
        transition: U.transition,
        side: U.side,
        inset: U.inset,
      }),
    );
    return (e, r) => {
      mt();
      return v(
        On(d),
        er(z(On(q))),
        {
          default: qt(({ open, close }) => [
            j.default
              ? (mt(),
                v(
                  On(r_1),
                  {
                    key: 0,
                    "as-child": ``,
                    class: Qn(On(U).class),
                  },
                  {
                    default: qt(() => [
                      xt(e.$slots, `default`, {
                        open,
                      }),
                    ]),
                    _: 2,
                  },
                  1032,
                  [`class`],
                ))
              : y(``, true),
            D(
              On(a),
              et(On(J), {
                "force-mount":
                  (On(J).disabled && On(U).unmountOnHide === false) ||
                  undefined,
              }),
              {
                default: qt(() => [
                  D(
                    On(h),
                    null,
                    {
                      default: qt(() => [
                        On(U).overlay
                          ? (mt(),
                            v(
                              On(o),
                              {
                                key: 0,
                                "data-slot": `overlay`,
                                class: Qn(
                                  Z.value.overlay({
                                    class: On(U).ui?.overlay,
                                  }),
                                ),
                              },
                              null,
                              8,
                              [`class`],
                            ))
                          : y(``, true),
                        D(
                          On(c_2),
                          et(
                            {
                              "data-side": On(U).side,
                              "data-slot": `content`,
                              class: Z.value.content({
                                class: [
                                  !j.default && On(U).class,
                                  On(U).ui?.content,
                                ],
                              }),
                            },
                            Y.value,
                            {
                              onEnter: (r[0] ||= (e) => C(`enter`)),
                              onAfterEnter: (r[1] ||= (e) => C(`after:enter`)),
                              onLeave: (r[2] ||= (e) => C(`leave`)),
                              onAfterLeave: (r[3] ||= (e) => C(`after:leave`)),
                            },
                            jt(X.value),
                          ),
                          {
                            default: qt(() => [
                              (!On(U).title && !j.title) ||
                              (!On(U).description && !j.description) ||
                              j.content
                                ? (mt(),
                                  v(
                                    On(u),
                                    {
                                      key: 0,
                                    },
                                    {
                                      default: qt(() => [
                                        !On(U).title && !j.title
                                          ? (mt(),
                                            v(On(i_2), {
                                              key: 0,
                                            }))
                                          : j.content
                                            ? (mt(),
                                              v(
                                                On(i_2),
                                                {
                                                  key: 1,
                                                },
                                                {
                                                  default: qt(() => [
                                                    xt(
                                                      e.$slots,
                                                      `title`,
                                                      {},
                                                      () => [
                                                        E(nr(On(U).title), 1),
                                                      ],
                                                    ),
                                                  ]),
                                                  _: 3,
                                                },
                                              ))
                                            : y(``, true),
                                        !On(U).description && !j.description
                                          ? (mt(),
                                            v(On(s), {
                                              key: 2,
                                            }))
                                          : j.content
                                            ? (mt(),
                                              v(
                                                On(s),
                                                {
                                                  key: 3,
                                                },
                                                {
                                                  default: qt(() => [
                                                    xt(
                                                      e.$slots,
                                                      `description`,
                                                      {},
                                                      () => [
                                                        E(
                                                          nr(On(U).description),
                                                          1,
                                                        ),
                                                      ],
                                                    ),
                                                  ]),
                                                  _: 3,
                                                },
                                              ))
                                            : y(``, true),
                                      ]),
                                      _: 3,
                                    },
                                  ))
                                : y(``, true),
                              xt(
                                e.$slots,
                                `content`,
                                {
                                  close,
                                },
                                () => [
                                  j.header ||
                                  On(U).title ||
                                  j.title ||
                                  On(U).description ||
                                  j.description ||
                                  On(U).close ||
                                  j.close
                                    ? (mt(),
                                      b(
                                        `div`,
                                        {
                                          key: 0,
                                          "data-slot": `header`,
                                          class: Qn(
                                            Z.value.header({
                                              class: On(U).ui?.header,
                                            }),
                                          ),
                                        },
                                        [
                                          xt(
                                            e.$slots,
                                            `header`,
                                            {
                                              close,
                                            },
                                            () => [
                                              On(U).title ||
                                              j.title ||
                                              On(U).description ||
                                              j.description
                                                ? (mt(),
                                                  b(
                                                    `div`,
                                                    {
                                                      key: 0,
                                                      "data-slot": `wrapper`,
                                                      class: Qn(
                                                        Z.value.wrapper({
                                                          class:
                                                            On(U).ui?.wrapper,
                                                        }),
                                                      ),
                                                    },
                                                    [
                                                      On(U).title || j.title
                                                        ? (mt(),
                                                          v(
                                                            On(i_2),
                                                            {
                                                              key: 0,
                                                              "data-slot": `title`,
                                                              class: Qn(
                                                                Z.value.title({
                                                                  class:
                                                                    On(U).ui
                                                                      ?.title,
                                                                }),
                                                              ),
                                                            },
                                                            {
                                                              default: qt(
                                                                () => [
                                                                  xt(
                                                                    e.$slots,
                                                                    `title`,
                                                                    {},
                                                                    () => [
                                                                      E(
                                                                        nr(
                                                                          On(U)
                                                                            .title,
                                                                        ),
                                                                        1,
                                                                      ),
                                                                    ],
                                                                  ),
                                                                ],
                                                              ),
                                                              _: 3,
                                                            },
                                                            8,
                                                            [`class`],
                                                          ))
                                                        : y(``, true),
                                                      On(U).description ||
                                                      j.description
                                                        ? (mt(),
                                                          v(
                                                            On(s),
                                                            {
                                                              key: 1,
                                                              "data-slot": `description`,
                                                              class: Qn(
                                                                Z.value.description(
                                                                  {
                                                                    class:
                                                                      On(U).ui
                                                                        ?.description,
                                                                  },
                                                                ),
                                                              ),
                                                            },
                                                            {
                                                              default: qt(
                                                                () => [
                                                                  xt(
                                                                    e.$slots,
                                                                    `description`,
                                                                    {},
                                                                    () => [
                                                                      E(
                                                                        nr(
                                                                          On(U)
                                                                            .description,
                                                                        ),
                                                                        1,
                                                                      ),
                                                                    ],
                                                                  ),
                                                                ],
                                                              ),
                                                              _: 3,
                                                            },
                                                            8,
                                                            [`class`],
                                                          ))
                                                        : y(``, true),
                                                    ],
                                                    2,
                                                  ))
                                                : y(``, true),
                                              xt(e.$slots, `actions`),
                                              On(U).close || j.close
                                                ? (mt(),
                                                  v(
                                                    On(u_2),
                                                    {
                                                      key: 1,
                                                      "as-child": ``,
                                                    },
                                                    {
                                                      default: qt(() => [
                                                        xt(
                                                          e.$slots,
                                                          `close`,
                                                          {
                                                            ui: Z.value,
                                                          },
                                                          () => [
                                                            On(U).close
                                                              ? (mt(),
                                                                v(
                                                                  t_1,
                                                                  et(
                                                                    {
                                                                      key: 0,
                                                                      icon:
                                                                        On(U)
                                                                          .closeIcon ||
                                                                        On(K).ui
                                                                          .icons
                                                                          .close,
                                                                      color: `neutral`,
                                                                      variant: `ghost`,
                                                                      "aria-label":
                                                                        On(t_2)(
                                                                          `slideover.close`,
                                                                        ),
                                                                    },
                                                                    typeof On(U)
                                                                      .close ==
                                                                      `object`
                                                                      ? On(U)
                                                                          .close
                                                                      : {},
                                                                    {
                                                                      "data-slot": `close`,
                                                                      class:
                                                                        Z.value.close(
                                                                          {
                                                                            class:
                                                                              On(
                                                                                U,
                                                                              )
                                                                                .ui
                                                                                ?.close,
                                                                          },
                                                                        ),
                                                                    },
                                                                  ),
                                                                  null,
                                                                  16,
                                                                  [
                                                                    `icon`,
                                                                    `aria-label`,
                                                                    `class`,
                                                                  ],
                                                                ))
                                                              : y(``, true),
                                                          ],
                                                        ),
                                                      ]),
                                                      _: 2,
                                                    },
                                                    1024,
                                                  ))
                                                : y(``, true),
                                            ],
                                          ),
                                        ],
                                        2,
                                      ))
                                    : y(``, true),
                                  _(
                                    `div`,
                                    {
                                      "data-slot": `body`,
                                      class: Qn(
                                        Z.value.body({
                                          class: On(U).ui?.body,
                                        }),
                                      ),
                                    },
                                    [
                                      xt(e.$slots, `body`, {
                                        close,
                                      }),
                                    ],
                                    2,
                                  ),
                                  j.footer
                                    ? (mt(),
                                      b(
                                        `div`,
                                        {
                                          key: 1,
                                          "data-slot": `footer`,
                                          class: Qn(
                                            Z.value.footer({
                                              class: On(U).ui?.footer,
                                            }),
                                          ),
                                        },
                                        [
                                          xt(e.$slots, `footer`, {
                                            close,
                                          }),
                                        ],
                                        2,
                                      ))
                                    : y(``, true),
                                ],
                              ),
                            ]),
                            _: 2,
                          },
                          1040,
                          [`data-side`, `class`],
                        ),
                      ]),
                      _: 2,
                    },
                    1024,
                  ),
                ]),
                _: 2,
              },
              1040,
              [`force-mount`],
            ),
          ]),
          _: 3,
        },
        16,
      );
    };
  },
};
const K = {
  class: `sticky top-0 z-10`,
};
const q = {
  class: `relative flex items-center justify-between`,
};
const J = {
  class: `text-xl font-semibold leading-6 text-gray-900 dark:text-white`,
};
export const t = Object.assign(
  k({
    __name: `SlideOver`,
    props: $(
      {
        title: String,
        size: {
          type: String,
          default: `medium`,
        },
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
      let n = Ft(e, `modelValue`);
      let i = e;
      let o = g(() => {
        if (i.size === `small`) {
          return `max-w-2xl`;
        }
        if (i.size === `big`) {
          return `max-w-4xl`;
        }
        if (i.size === `ultra`) {
          return `max-w-6xl`;
        }
        return `max-w-3xl`;
      });
      return (r, i) => {
        let c = n_1;
        let l = t_2;
        let u = G;
        mt();
        return v(
          u,
          {
            open: n.value,
            "onUpdate:open": (i[1] ||= (e) => (n.value = e)),
            ui: {
              content: `w-screen ` + On(o),
            },
          },
          {
            content: qt(() => [
              D(
                l,
                {
                  class: `flex flex-col flex-1 overflow-auto`,
                  ui: {
                    body: `flex-1`,
                    root: `ring-0 divide-y divide-gray-200 dark:divide-gray-700`,
                  },
                },
                {
                  header: qt(() => [
                    _(`div`, K, [
                      (i[2] ||= _(
                        `div`,
                        {
                          "aria-hidden": `true`,
                          class: `absolute inset-0 bg-white/70 dark:bg-gray-900/30 backdrop-blur-xs pointer-events-none`,
                        },
                        null,
                        -1,
                      )),
                      _(`div`, q, [
                        _(`h3`, J, nr(e.title), 1),
                        _(`div`, null, [
                          xt(r.$slots, `buttons`),
                          D(
                            c,
                            {
                              text: `Close`,
                              arrow: ``,
                              content: {
                                sideOffset: 10,
                              },
                              class: `inline-block ml-2`,
                            },
                            {
                              default: qt(() => [
                                _(
                                  `button`,
                                  {
                                    class: `p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-hidden transition-all duration-300`,
                                    onClick: (i[0] ||= (e) =>
                                      (n.value = false)),
                                  },
                                  [
                                    D(On(f), {
                                      class: `h-6 w-6`,
                                      "aria-hidden": `true`,
                                    }),
                                  ],
                                ),
                              ]),
                              _: 1,
                            },
                          ),
                        ]),
                      ]),
                    ]),
                  ]),
                  default: qt(() => [xt(r.$slots, `default`)]),
                  _: 3,
                },
              ),
            ]),
            _: 3,
          },
          8,
          [`open`, `ui`],
        );
      };
    },
  }),
  {
    __name: `SlideOver`,
  },
);
