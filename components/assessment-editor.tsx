"use client";
import { useState } from "react";
export default function AssessmentEditor() {
  const [questions, setQuestions] = useState([
    { prompt: "", options: ["", "", "", ""], answer: 0 },
  ]);
  return (
    <>
      <input type="hidden" name="questions" value={JSON.stringify(questions)} />
      {questions.map((q, n) => (
        <fieldset className="platform-panel mt-5" key={n}>
          <legend className="font-bold">Question {n + 1}</legend>
          <label className="form-label">
            Question
            <input
              className="form-input"
              required
              minLength={3}
              maxLength={1000}
              value={q.prompt}
              onChange={(e) =>
                setQuestions(
                  questions.map((x, i) =>
                    i === n ? { ...x, prompt: e.target.value } : x,
                  ),
                )
              }
            />
          </label>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {q.options.map((o, j) => (
              <label key={j} className="form-label">
                Option {j + 1}
                <input
                  className="form-input"
                  value={o}
                  required
                  maxLength={500}
                  onChange={(e) =>
                    setQuestions(
                      questions.map((x, i) =>
                        i === n
                          ? {
                              ...x,
                              options: x.options.map((s, k) =>
                                k === j ? e.target.value : s,
                              ),
                            }
                          : x,
                      ),
                    )
                  }
                />
              </label>
            ))}
          </div>
          <label className="form-label mt-4">
            Correct option
            <select
              className="form-input"
              value={q.answer}
              onChange={(e) =>
                setQuestions(
                  questions.map((x, i) =>
                    i === n ? { ...x, answer: Number(e.target.value) } : x,
                  ),
                )
              }
            >
              {q.options.map((_, j) => (
                <option value={j} key={j}>
                  Option {j + 1}
                </option>
              ))}
            </select>
          </label>
          {questions.length > 1 && (
            <button
              type="button"
              className="text-link mt-4"
              onClick={() => setQuestions(questions.filter((_, i) => i !== n))}
            >
              Remove this unsaved question
            </button>
          )}
        </fieldset>
      ))}
      <button
        type="button"
        disabled={questions.length >= 50}
        className="secondary-button mt-5"
        onClick={() =>
          setQuestions([
            ...questions,
            { prompt: "", options: ["", "", "", ""], answer: 0 },
          ])
        }
      >
        Add question +
      </button>
    </>
  );
}
