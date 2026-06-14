// Vercel Serverless Function — Claude API 중계
// 환경변수에 ANTHROPIC_API_KEY 를 등록하세요.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST만 허용돼요" });
  }

  try {
    const { word } = req.body || {};
    if (!word || typeof word !== "string") {
      return res.status(400).json({ error: "낱말이 필요해요" });
    }

    const prompt = `너는 5~6세 유치원 아이에게 낱말을 설명해주는 친절한 곰돌이 선생님이야.
아이가 "${word}" 라는 낱말의 뜻을 물어봤어.

아주 쉽고 따뜻한 말로 설명해줘. 어려운 단어는 절대 쓰지 마.
아래 JSON 형식으로만 답해. 다른 말, 마크다운, 백틱은 절대 쓰지 마.

{
  "word": "${word}",
  "emoji": "낱말을 가장 잘 나타내는 이모지 1개",
  "meaning": "5~6세 아이도 이해할 수 있는 1~2문장 설명. 존댓말. 따뜻하게.",
  "example": "이 낱말을 쓴 짧고 쉬운 예문 1개. 아이 일상 속 상황.",
  "emojis": "낱말과 관련된 이모지 4~5개를 한 줄로"
}

만약 "${word}"가 낱말이 아니거나 아이에게 부적절하면 meaning에 "음~ 그건 곰돌이도 잘 모르겠어요! 다른 낱말을 물어봐 줄래요?" 라고 넣고 나머지는 빈 칸으로 둬.`;

    const apiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      console.error("Anthropic API error:", errText);
      return res.status(502).json({ error: "곰돌이 연결 실패" });
    }

    const data = await apiRes.json();
    let txt = data.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("");
    txt = txt.replace(/```json|```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(txt);
    } catch {
      return res.status(502).json({ error: "곰돌이 답을 못 읽었어요" });
    }

    return res.status(200).json(parsed);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "서버 오류" });
  }
}
