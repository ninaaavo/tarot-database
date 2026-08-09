import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { CardDetailPage } from "@/pages/CardDetailPage";
import { DeckPage } from "@/pages/DeckPage";
import { GeneralNotesPage } from "@/pages/GeneralNotesPage";
import { ReadingDetailPage } from "@/pages/ReadingDetailPage";
import { ReadingEditorPage } from "@/pages/ReadingEditorPage";
import { ReadingListPage } from "@/pages/ReadingListPage";

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: "/", element: <DeckPage /> },
      { path: "/cards/:id", element: <CardDetailPage /> },
      { path: "/notes", element: <GeneralNotesPage /> },
      { path: "/readings", element: <ReadingListPage /> },
      { path: "/readings/new", element: <ReadingEditorPage /> },
      { path: "/readings/:id", element: <ReadingDetailPage /> },
      { path: "/readings/:id/edit", element: <ReadingEditorPage /> },
    ],
  },
]);
