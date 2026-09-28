import { b, k, mt, v } from "./CoKk4mC0.js";
import { t as t_1 } from "./DKSmMEZa2.js";
const a = [`innerHTML`];
export const t = Object.assign(
  k({
    __name: `Logs`,
    props: {
      logs: {},
    },
    setup(t) {
      return (o, s) => {
        let c = t_1;
        if (t.logs.length) {
          return (
            mt(),
            b(
              `pre`,
              {
                key: 0,
                class: `whitespace-pre-line rounded-sm border dark:border-gray-600 bg-gray-50 dark:bg-gray-700 select-text text-base dark:text-gray-300 w-full px-4 sm:px-6 py-2`,
                innerHTML: t.logs,
              },
              null,
              8,
              a,
            )
          );
        }
        return (
          mt(),
          v(c, {
            key: 1,
          })
        );
      };
    },
  }),
  {
    __name: `Logs`,
  },
);
