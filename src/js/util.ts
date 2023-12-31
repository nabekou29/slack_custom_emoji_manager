/**
 * 処理を指定時間中断します
 * @param ms 止める時間
 */
export const sleep = (ms: number) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(undefined);
    }, ms);
  });
};

/**
 * 日付をフォーマットする
 * @param date 日付
 */
export const formatDate = (date: Date) => {
  // yyyy_MM_dd の形式で日付を取得
  const formattedCurrentDate = [
    `000${date.getFullYear()}`.slice(-4),
    `0${date.getMonth() + 1}`.slice(-2),
    `0${date.getDate()}`.slice(-2),
  ].join('_');

  return formattedCurrentDate;
};

/**
 * Blobオブジェクトを保存
 * @param blob Blobオブジェクト
 * @param fileName ファイル名
 */
export const downloadBlob = async (blob: Blob, fileName: string) => {
  const downLoadLink = document.createElement('a');
  downLoadLink.download = fileName;
  downLoadLink.href = URL.createObjectURL(blob);
  downLoadLink.dataset.downloadurl = ['blob', downLoadLink.download, downLoadLink.href].join(':');
  downLoadLink.click();
};

/**
 * タスクが失敗した際に再度タスクを実行する
 * @param task タスク
 * @param condition 再度処理を試みる条件。未指定時は必ず再度処理を試みる
 * @param num 再度処理を試みる回数
 * @param sleep 再度処理を試みる間隔
 */
export const retry = <T, E>(
  task: () => Promise<T>,
  {
    condition = () => true,
    num,
    sleep: sleepTime,
  }: {
    condition?: (e: E) => boolean;
    num: number;
    sleep: number;
  }
): Promise<T> => {
  return (async () => {
    let res: T;
    for (const i of [...Array(num + 1).keys()]) {
      try {
        // 実行
        res = await task();
        break;
      } catch (e) {
        if (i !== num && condition(e)) {
          await sleep(sleepTime);
          // 再度実行
          // eslint-disable-next-line no-continue
          continue;
        }
        throw e;
      }
    }
    // 成功しなかった場合には例外が投げられるため、
    // ここに到達した際には res には必ず値が入っている
    return res!;
  })();
};
