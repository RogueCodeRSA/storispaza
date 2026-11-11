import { createRoot } from "react-dom/client";
import OfflineJourney from "../components/OfflineJourney";
import type { ReaderBook } from "../domain/reader";
import type { Story } from "../domain/story";

const saved = document.getElementById("reviewed-edition")?.textContent;
const edition = saved ? JSON.parse(saved) as { book: ReaderBook; story: Story } : {};
createRoot(document.getElementById("root")!).render(<OfflineJourney {...edition} />);
