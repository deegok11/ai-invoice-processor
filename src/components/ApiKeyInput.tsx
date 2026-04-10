import { useCallback, useState } from 'react';

interface ApiKeyInputProps {
  onSubmit: (apiKey: string, provider: 'openai' | 'gemini') => void;
  initialProvider?: 'openai' | 'gemini';
  onCancel?: () => void;
}

export function ApiKeyInput({ onSubmit, initialProvider = 'openai', onCancel }: ApiKeyInputProps) {
  const [apiKey, setApiKey] = useState('');
  const [provider, setProvider] = useState<'openai' | 'gemini'>(initialProvider);

  const handleSubmit = useCallback(() => {
    const trimmed = apiKey.trim();
    if (!trimmed) return;
    onSubmit(trimmed, provider);
  }, [apiKey, provider, onSubmit]);

  return (
    <div className="api-key-input">
      <h3>LLM Configuration</h3>
      <p className="api-key-note">
        Your API key is stored only in memory for this session and never persisted.
      </p>
      <div className="api-key-form">
        <div className="provider-select">
          <label>
            <input
              type="radio"
              name="provider"
              value="openai"
              checked={provider === 'openai'}
              onChange={() => setProvider('openai')}
            />
            OpenAI (GPT-4o)
          </label>
          <label>
            <input
              type="radio"
              name="provider"
              value="gemini"
              checked={provider === 'gemini'}
              onChange={() => setProvider('gemini')}
            />
            Google Gemini
          </label>
        </div>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={provider === 'openai' ? 'sk-...' : 'AIza...'}
          className="api-key-field"
        />
        <div className="api-key-actions">
          <button
            onClick={handleSubmit}
            disabled={!apiKey.trim()}
            className="btn btn-primary"
          >
            Save & Continue
          </button>
          {onCancel && (
            <button onClick={onCancel} className="btn btn-secondary">
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
