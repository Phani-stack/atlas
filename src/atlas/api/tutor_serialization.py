from typing import Any


def tutor_status(tutor: Any) -> dict[str, Any]:
    status = tutor.status()
    status["history"] = [
        {
            "id": str(index + 1),
            "number": index + 1,
            "module_id": item["module_id"],
            "concept": item["concept"],
            "type": item["type"],
            "question": item["question"],
            "answer": item["answer"],
            "score": item["score"],
            "verdict": item["verdict"],
            "timestamp": item["ts"],
            "difficulty": item["difficulty"],
            "hints": item["hints"],
            "review": item["review"],
        }
        for index, item in enumerate(tutor.s.get("history", []))
    ]
    return status


def public_question(question: dict[str, Any] | None) -> dict[str, Any] | None:
    if question is None:
        return None

    public = {
        key: question[key]
        for key in (
            "id",
            "module_id",
            "module_title",
            "concept",
            "type",
            "difficulty",
            "review",
            "title",
            "prompt",
            "sources",
        )
        if key in question
    }
    public["hints_available"] = len(question.get("hints", []))
    if question.get("type") == "mcq":
        public["options"] = question["options"]
    if question.get("type") == "code":
        code = question["code"]
        example_count = code.get("examples", 0)
        public["code"] = {
            "fn": code.get("fn", ""),
            "starter": code.get("starter", ""),
            "language": code.get("language", "Python"),
            "examples": [
                {"args": test["args"], "expected": test["expected"]}
                for test in code.get("tests", [])[:example_count]
            ],
        }
    return public
