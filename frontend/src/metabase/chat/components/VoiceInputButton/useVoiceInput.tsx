import { useState } from "react";

export function useVoiceInput() {
  const [listening, setListening] = useState(false);

  return {
    listening,
    setListening,
  };
}
