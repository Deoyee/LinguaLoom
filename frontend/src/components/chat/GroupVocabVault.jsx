import React, { useState, useEffect } from "react";
import { Sparkles, Plus, Trash2, X } from "lucide-react";
import { getLanguageFlag } from "../../lib/languageUtils.jsx";
import toast from "react-hot-toast";

export const GroupVocabVault = ({ channelId, targetLanguage = "Spanish" }) => {
  const storageKey = `hiME_group_vocab_${channelId || "default"}`;

  const [vocabList, setVocabList] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const entries = JSON.parse(saved);
        if (Array.isArray(entries)) {
          return entries.filter(
            (entry) => !["1", "2", "3"].includes(String(entry.id))
          );
        }
      }
    } catch {
      // Start empty when saved vocabulary is unavailable or malformed.
    }
    return [];
  });

  const [isAdding, setIsAdding] = useState(false);
  const [newWord, setNewWord] = useState("");
  const [newMeaning, setNewMeaning] = useState("");
  const [newType, setNewType] = useState("word");

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(vocabList));
    } catch {
      // Keep the in-memory list usable when browser storage is unavailable.
    }
  }, [vocabList, storageKey]);

  const handleAddWord = (e) => {
    e.preventDefault();
    if (!newWord.trim() || !newMeaning.trim()) return;

    const entry = {
      id: Date.now().toString(),
      word: newWord.trim(),
      type: newType,
      meaning: newMeaning.trim(),
      lang: targetLanguage,
      addedBy: "You",
    };

    setVocabList((prev) => [entry, ...prev]);
    setNewWord("");
    setNewMeaning("");
    setIsAdding(false);
    toast.success(`Pinned "${entry.word}" to Group Vocab Bank! ✨`);
  };

  const removeWord = (id) => {
    setVocabList((prev) => prev.filter((v) => v.id !== id));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
          <Sparkles className="size-4" />
          <span>Group Vocab Bank</span>
          <span className="px-2 py-0.2 rounded-full text-[10px] bg-primary/20 text-primary font-mono font-bold">
            {vocabList.length}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsAdding(!isAdding)}
          className="btn btn-xs rounded-xl bg-primary/15 hover:bg-primary/25 text-primary font-bold gap-1"
        >
          {isAdding ? <X className="size-3" /> : <Plus className="size-3" />}
          <span>{isAdding ? "Close" : "Add Word"}</span>
        </button>
      </div>

      {/* Add New Word Form */}
      {isAdding && (
        <form
          onSubmit={handleAddWord}
          className="p-3 rounded-2xl bg-base-100 border border-primary/30 space-y-2 text-xs animate-scaleUp"
        >
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              placeholder="Word or phrase..."
              className="flex-1 input input-bordered input-xs rounded-lg text-xs focus:border-primary"
              required
            />
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              className="select select-bordered select-xs rounded-lg text-xs"
            >
              <option value="noun">noun</option>
              <option value="verb">verb</option>
              <option value="adj">adj</option>
              <option value="phrase">phrase</option>
              <option value="idiom">idiom</option>
            </select>
          </div>
          <input
            type="text"
            value={newMeaning}
            onChange={(e) => setNewMeaning(e.target.value)}
            placeholder="Meaning or translation..."
            className="w-full input input-bordered input-xs rounded-lg text-xs focus:border-primary"
            required
          />
          <div className="flex items-center justify-end gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="btn btn-xs btn-ghost rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-xs btn-primary text-primary-content font-bold rounded-lg px-3"
            >
              Pin Word
            </button>
          </div>
        </form>
      )}

      {/* Vocab Cards List */}
      <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar">
        {vocabList.length === 0 ? (
          <p className="text-xs text-center py-4 opacity-50">
            No words pinned yet. Tap "Add Word" to contribute!
          </p>
        ) : (
          vocabList.map((item) => (
            <div
              key={item.id}
              className="p-2.5 rounded-2xl bg-base-100 border border-base-content/10 hover:border-primary/40 transition-colors flex items-center justify-between gap-2 group"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-primary truncate">
                    {item.word}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-base-300 text-base-content/60 font-mono">
                    {item.type}
                  </span>
                </div>
                <p className="text-[11px] text-base-content/80 truncate mt-0.5">
                  {item.meaning}
                </p>
                <p className="text-[9px] text-base-content/50 mt-0.5">
                  Added by {item.addedBy}
                </p>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <span className="text-sm select-none">
                  {getLanguageFlag(item.lang)}
                </span>
                <button
                  type="button"
                  onClick={() => removeWord(item.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-base-content/40 hover:text-error transition-opacity"
                  title="Remove from bank"
                >
                  <Trash2 className="size-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default GroupVocabVault;
