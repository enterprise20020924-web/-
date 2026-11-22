type NativePersonaModule = {
  user_avatar: string;
  initUserAvatar: (avatarId: string) => void;
  setPersonaDescription: (options: { displayName: string }) => void;
};

type NativeUserModule = {
  name1: string;
  setUserName: (name: string, options: { toastPersonaNameChange: boolean }) => void;
  saveSettingsDebounced: () => void;
};

export async function activateUserPersona(personaName: string): Promise<boolean> {
  const globalAny = window as any;
  const getPersonaApi = globalAny.getPersona || globalAny.TavernHelper?.getPersona;
  if (typeof getPersonaApi !== 'function') return false;
  const persona = getPersonaApi(personaName) as Persona;
  const host = (window.top || window) as typeof window;

  // 共用酒馆主窗口的模块实例和用户设定状态。
  const importFromTavern = host.Function('url', 'return import(url)') as (url: string) => Promise<unknown>;
  const [personaModule, userModule] = (await Promise.all([
    importFromTavern(new URL('/scripts/personas.js', host.location.origin).href),
    importFromTavern(new URL('/script.js', host.location.origin).href),
  ])) as [NativePersonaModule, NativeUserModule];
  const context = (host as any).SillyTavern.getContext();

  personaModule.initUserAvatar(persona.avatar_id);
  userModule.setUserName(persona.name, { toastPersonaNameChange: false });
  if (context.powerUserSettings.persona_auto_lock && context.chatMetadata.persona !== persona.avatar_id) {
    context.chatMetadata.persona = persona.avatar_id;
    context.saveMetadataDebounced();
  }
  personaModule.setPersonaDescription({ displayName: persona.name });
  userModule.saveSettingsDebounced();
  await context.eventSource.emit(context.eventTypes.PERSONA_CHANGED, persona.avatar_id);

  return personaModule.user_avatar === persona.avatar_id && userModule.name1 === persona.name;
}
