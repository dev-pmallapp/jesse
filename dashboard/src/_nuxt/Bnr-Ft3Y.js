import {
  D,
  On,
  _,
  b as b_1,
  ct,
  ft,
  k,
  mt,
  nr,
  o as o_1,
  qt,
  u,
  v,
  vn,
  xt,
  y as y_1,
} from "./CoKk4mC0.js";
import { Et, Yt } from "./Cd-sGgPF.js";
import { f } from "./OaeI3Ulg.js";
const y = {
  key: 0,
  class: `relative z-10 max-w-[95vw] max-h-[90vh] flex flex-col items-center`,
};
const b = {
  key: 0,
  class: `text-white/70 text-xs mb-3 tracking-wide select-none`,
};
const x = [`src`, `alt`];
export const t = Object.assign(
  k({
    __name: `ImageLightbox`,
    props: {
      src: {},
      alt: {},
    },
    setup(o) {
      let S = vn(false);
      function onClick() {
        S.value = true;
        document.body.style.overflow = `hidden`;
      }
      function w() {
        S.value = false;
        document.body.style.overflow = ``;
      }
      function T(e) {
        if (e.key === `Escape` && S.value) {
          w();
        }
      }
      ct(() => {
        window.addEventListener(`keydown`, T);
      });
      ft(() => {
        window.removeEventListener(`keydown`, T);
        document.body.style.overflow = ``;
      });
      return (i, a) => {
        mt();
        return b_1(
          o_1,
          null,
          [
            _(
              `div`,
              {
                class: `relative cursor-zoom-in`,
                onClick,
              },
              [xt(i.$slots, `default`)],
            ),
            (mt(),
            v(
              u,
              {
                to: `body`,
              },
              [
                D(
                  Et,
                  {
                    "enter-active-class": `transition-all duration-150 ease-out`,
                    "enter-from-class": `opacity-0`,
                    "enter-to-class": `opacity-100`,
                    "leave-active-class": `transition-all duration-100 ease-in`,
                    "leave-from-class": `opacity-100`,
                    "leave-to-class": `opacity-0`,
                  },
                  {
                    default: qt(() => [
                      On(S)
                        ? (mt(),
                          b_1(
                            `div`,
                            {
                              key: 0,
                              class: `fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-8`,
                              onClick: Yt(w, [`self`]),
                            },
                            [
                              _(`div`, {
                                class: `absolute inset-0 bg-black/90 backdrop-blur-xs`,
                                onClick: w,
                              }),
                              D(
                                Et,
                                {
                                  "enter-active-class": `transition-all duration-150 ease-out`,
                                  "enter-from-class": `opacity-0 scale-95`,
                                  "enter-to-class": `opacity-100 scale-100`,
                                  "leave-active-class": `transition-all duration-100 ease-in`,
                                  "leave-from-class": `opacity-100 scale-100`,
                                  "leave-to-class": `opacity-0 scale-95`,
                                },
                                {
                                  default: qt(() => [
                                    On(S)
                                      ? (mt(),
                                        b_1(`div`, y, [
                                          _(
                                            `button`,
                                            {
                                              class: `absolute -top-4 -right-4 z-20 bg-white/10 hover:bg-white/20 backdrop-blur-xs text-white rounded-full p-1.5 transition-colors duration-150 shadow-lg`,
                                              onClick: w,
                                            },
                                            [
                                              D(On(f), {
                                                class: `h-5 w-5`,
                                              }),
                                            ],
                                          ),
                                          o.alt
                                            ? (mt(), b_1(`p`, b, nr(o.alt), 1))
                                            : y_1(``, true),
                                          _(
                                            `img`,
                                            {
                                              src: o.src,
                                              alt: o.alt,
                                              class: `max-w-[95vw] max-h-[85vh] rounded-lg shadow-2xl object-contain ring-1 ring-white/10`,
                                            },
                                            null,
                                            8,
                                            x,
                                          ),
                                        ]))
                                      : y_1(``, true),
                                  ]),
                                  _: 1,
                                },
                              ),
                            ],
                          ))
                        : y_1(``, true),
                    ]),
                    _: 1,
                  },
                ),
              ],
            )),
          ],
          64,
        );
      };
    },
  }),
  {
    __name: `ImageLightbox`,
  },
);
