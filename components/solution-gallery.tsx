import { EditorialImage } from "./design";
import { serviceCategories } from "@/lib/company";
import { solutionVisuals } from "@/lib/visuals";
export default function SolutionGallery() {
  return (
    <div className="solution-gallery">
      {serviceCategories.map((s, i) => {
        const visual = solutionVisuals[s.slug];
        return (
          <article
            className={`solution-story solution-story-${i + 1}`}
            key={s.slug}
          >
            <a href={`/services/${s.slug}`} className="solution-story-link">
              <EditorialImage
                src={visual.src}
                alt={visual.alt}
                className="solution-story-image"
              />
              <div className="solution-story-copy">
                <span className="story-number">
                  0{i + 1} / {visual.label}
                </span>
                <h3>{s.title}</h3>
                <p>{s.summary}</p>
                <span className="story-explore">
                  Explore solution <span aria-hidden="true">↗</span>
                </span>
              </div>
            </a>
          </article>
        );
      })}
    </div>
  );
}
