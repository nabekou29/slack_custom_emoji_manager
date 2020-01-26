import JSZip from 'jszip';

/**
 * 処理を指定時間中断します
 * @param ms 止める時間
 */
export const sleep = (ms: number) => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
};

/**
 * 日付をフォーマットする
 * @param date 日付
 */
export const formatDate = (date: Date) => {
  // yyyy_MM_dd の形式で日付を取得
  const formatedCurrentDate = [
    `000${date.getFullYear()}`.slice(-4),
    `0${date.getMonth() + 1}`.slice(-2),
    `0${date.getDate()}`.slice(-2)
  ].join('_');

  return formatedCurrentDate;
};

/**
 * ZIPオブジェクトを保存
 * @param zip ZIP
 * @param fileName ファイル名
 */
export const saveZipFile = async (zip: JSZip, fileName: string) => {
  const content = await zip.generateAsync({ type: 'blob' });

  const downLoadLink = document.createElement('a');
  downLoadLink.download = fileName;
  downLoadLink.href = URL.createObjectURL(content);
  downLoadLink.dataset.downloadurl = ['blob', downLoadLink.download, downLoadLink.href].join(':');
  downLoadLink.click();
};

/** オプション */
interface Options<T, E> {
  callback?: (res: T, cnt: number) => any;
  rePostCondition?: (e: E) => boolean;
  rePostNum?: number;
  sleep?: number;
  sleepRePost?: number;
}

/**
 * 複数のタスクを逐次処理する
 * @param tasks タスク
 * @param options.callback タスク完了時に呼ばれる関数
 * @param options.rePostCondition 再度処理を試みる条件
 * @param options.rePostNum 再度処理を試みる回数 {default: 3}
 * @param options.sleep タスクごとの間隔 {default: 100}
 * @param options.sleepRePost 再度処理を試みる間隔 {default: 3000}
 */
export const runTasksSequential = async <T, E>(
  tasks: (() => Promise<T>)[],
  {
    callback,
    rePostCondition,
    rePostNum = 3,
    sleep: sleepTime = 100,
    sleepRePost = 3000
  }: Options<T, E>
) => {
  let cnt = 0;
  for (const task of tasks) {
    let res: T;
    for (const i of [...Array(rePostNum + 1).keys()]) {
      try {
        // 削除
        res = await task();
        break;
      } catch (e) {
        if (i !== rePostNum && rePostCondition?.(e)) {
          // 再度投げる
          await sleep(sleepRePost);
          // eslint-disable-next-line no-continue
          continue;
        }
        throw e;
      }
    }
    cnt += 1;
    // 指定回数内に成功しない場合は例外が投げられるので res には必ず値が入る
    callback?.(res!, cnt);
    // 負荷軽減
    await sleep(sleepTime);
  }
};
