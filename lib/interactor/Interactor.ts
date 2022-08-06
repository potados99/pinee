/**
 * 사용자와 상호작용하는 객체입니다.
 * 사용자에게 메시지로 정보를 알리고 답변을 받을 수 있습니다.
 */
export default interface Interactor<ParamT, ResultT> {
  execute(params: ParamT): Promise<ResultT>;
}
