import { klona } from 'klona';
import { commitInlineCombatData, generateCombatNarration, type InlineCombatSession } from './inline-session';

/** Each frame starts from its own fight floor and follows only its own appended narration. */
export async function createCombatGlobals(sourceMessageId: number, session?: InlineCombatSession) {
  await waitGlobalInitialized('Mvu');
  let variableMessageId = session?.variableMessageId ?? sourceMessageId;
  const readSnapshots = new WeakMap<Mvu.MvuData, Mvu.MvuData>();

  const resolveOption = (option: VariableOption): VariableOption =>
    option.type === 'message' &&
    (option.message_id === undefined || option.message_id === 'latest' || option.message_id === -1)
      ? { ...option, message_id: variableMessageId }
      : option;

  const scopedMvu: typeof Mvu = {
    ...Mvu,
    getMvuData: option => {
      const resolved = resolveOption(option);
      if (session && resolved.type === 'message' && resolved.message_id === variableMessageId) {
        const data = klona(session.data);
        readSnapshots.set(data, klona(data));
        return data;
      }
      return Mvu.getMvuData(resolved);
    },
    replaceMvuData: (data, option) => {
      const resolved = resolveOption(option);
      return session && resolved.type === 'message' && resolved.message_id === variableMessageId
        ? commitInlineCombatData(session, data, readSnapshots.get(data))
        : Mvu.replaceMvuData(data, resolved);
    },
  };

  const appendCombatMessages: typeof createChatMessages = async (messages, options) => {
    const data = scopedMvu.getMvuData({ type: 'message', message_id: 'latest' });
    await createChatMessages(
      messages.map(message => ({ ...message, data: message.data ?? klona(data) })),
      options,
    );
    if (messages.length > 0 && (options?.insert_before === undefined || options.insert_before === 'end')) {
      variableMessageId = getChatMessages(-1)[0].message_id;
      if (session) session.variableMessageId = variableMessageId;
    }
  };

  const helper = {
    getVariables: (option: VariableOption) => getVariables(resolveOption(option)),
    replaceVariables: (data: Record<string, any>, option: VariableOption) =>
      replaceVariables(data, resolveOption(option)),
    insertOrAssignVariables: (data: Record<string, any>, option: VariableOption) =>
      insertOrAssignVariables(data, resolveOption(option)),
    getChatMessages,
    createChatMessages: appendCombatMessages,
    generate: generateCombatNarration,
    triggerSlash,
  };

  return {
    ...helper,
    TavernHelper: helper,
    Mvu: scopedMvu,
    waitGlobalInitialized,
    getCurrentMessageId: () => sourceMessageId,
    getScriptId,
    SillyTavern,
    _,
    toastr,
  };
}
