export type ApiErrorCode =
	| 'bad_request'
	| 'not_found'
	| 'unauthorized'
	| 'method_not_allowed'
	| 'internal_error'

export function json<ResponseBody>(body: ResponseBody, init?: ResponseInit): Response {
	return new Response(JSON.stringify(body), {
		...init,
		headers: {
			'content-type': 'application/json; charset=utf-8',
			...init?.headers,
		},
	})
}

export function apiError(code: ApiErrorCode, message: string, status: number): Response {
	return json(
		{
			error: {
				code,
				message,
			},
		},
		{ status },
	)
}

export async function readJsonBody(request: Request): Promise<unknown> {
	const contentType = request.headers.get('content-type') ?? ''

	if (!contentType.includes('application/json')) {
		return {}
	}

	return request.json()
}
