import { applyAiExperienceDelta, getSettledExperience, settleExperience, type ExperienceData } from './experience';
import { toPath } from 'lodash';

type ExperienceCommand = { type: string; args: unknown[] };
const unquote = (value: unknown) =>
  String(value ?? '')
    .trim()
    .replace(/^(['"])(.*)\1$/, '$2');
const numberArgument = (value: unknown) => {
  const text = unquote(value);
  return text && Number.isFinite(Number(text)) ? Number(text) : undefined;
};

/** 只接受解析出的经验操作；直接改 stat_data 或等级不构成获得经验的依据。 */
export function settleAiExperienceCommands(
  data: ExperienceData,
  previous: ExperienceData,
  commands: ExperienceCommand[],
) {
  const initial = getSettledExperience(previous);
  let proposed = initial;
  for (const command of commands) {
    const path = toPath(unquote(command.args[0]));
    if (path[0] === 'stat_data') path.shift();
    if (path.join('.') !== '角色基础.经验值' || proposed === undefined) continue;
    const amount = numberArgument(command.args.at(-1));
    if (amount === undefined) continue;
    if (command.type === 'add' || command.type === 'delta') proposed += amount;
    else if (command.type === 'set' || command.type === 'replace') proposed = amount;
  }
  const settled = settleExperience(data, previous);
  if (initial === undefined || proposed === undefined || !Number.isFinite(proposed)) return settled;
  const applied = applyAiExperienceDelta(data, proposed - initial);
  return { ...applied, changed: settled.changed || applied.changed };
}

/** 临时解析也可计算候选结果，但同一解析对象的命令只消费一次，不写入任何楼层。 */
export function createAiExperienceSettlement() {
  const parsed = new WeakMap<object, ExperienceCommand[]>();
  return {
    capture(data: ExperienceData, commands: ExperienceCommand[]) {
      // ZOD 会执行命令并清空原数组，必须保留解析时的独立副本。
      parsed.set(
        data,
        commands.map(command => ({ type: command.type, args: [...command.args] })),
      );
    },
    settle(data: ExperienceData, previous: ExperienceData) {
      const commands = parsed.get(data) ?? [];
      parsed.delete(data);
      return settleAiExperienceCommands(data, previous, commands);
    },
  };
}
