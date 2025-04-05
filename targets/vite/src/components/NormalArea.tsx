import { useState } from "react";

export default function NormalArea() {
  const [cnt, setCnt] = useState(0);
  return (
    <div>
      <h1 className="mb-4 text-4xl font-bold">
        こんにちは！
      </h1>

      <button
        className="bg-blue-200 text-blue-900 font-bold px-4 py-2 rounded-md transition transform active:scale-95 hover:bg-blue-300"
        onClick={() => setCnt(cnt + 1)}
      >
        クリックしてインクリメント
      </button>

      <p className="mt-2 mb-10">
        <span className="font-medium">{cnt}</span>
        回クリックされました
      </p>
    </div>
  )
}
