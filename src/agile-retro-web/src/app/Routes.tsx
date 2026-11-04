import { Route, Routes as ReactRouterDOMRoutes } from "react-router";
import { BaseLayout } from "./BaseLayout";
import { DesignPage } from "../features/design/DesignPage";
import { HomePage } from "../features/home/HomePage";
import { SessionPage } from "../features/session/SessionPage";
import { NotFoundPage } from "./NotFoundPage";

export default function Routes() {
  return (
    <ReactRouterDOMRoutes>
      <Route element={<BaseLayout />}>
        <Route index element={<HomePage />} />
        <Route element={<DesignPage />} path="/design" />
        <Route element={<NotFoundPage />} path="*" />
      </Route>

      {/* The board is full-width and has its own header, so it sits outside
          the marketing shell. */}
      <Route element={<SessionPage />} path="/sessions/:code" />
    </ReactRouterDOMRoutes>
  );
}
