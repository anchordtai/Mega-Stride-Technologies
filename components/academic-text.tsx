import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
export default function AcademicText({ body }: { body: string }) {
  return (
    <div className="academic-prose">
      <Markdown remarkPlugins={[remarkGfm]}>{body}</Markdown>
    </div>
  );
}
