/*global page*/
//Login reloads the page, and will remove this styles. Use after login.
export default async (currentPage = page) => {
  await currentPage.addStyleTag({
    content: `
      *,
      *::after,
      *::before {
          transition-delay: 0s !important;
          transition-duration: 0s !important;
          animation-delay: -0.0001s !important;
          animation-duration: 0s !important;
          animation-play-state: paused !important;
          caret-color: transparent !important;
      }
      #nprogress {
        visibility: hidden !important;
      }
      `,
  });
};
