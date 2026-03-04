import {getAuth} from 'firebase-admin/auth';
import {appAdmin} from './admin'; // См. ниже
import {c} from '~~/content/context'; // Инициализированный клиент Prisma

export async function cookieVerifyOrThrow(event: any) {
  // Читаем куку
  const sessionCookie = getCookie(event, c.cookie.session.token);

  if (!sessionCookie) {
    throw createError({statusCode: 401, message: 'No token'});
  }

  try {
    // 1. Проверяем токен через Firebase Admin
    const decodedClaims = await getAuth(appAdmin).verifySessionCookie(sessionCookie, true);
    if(decodedClaims.email ==='yevhenii.kamenskyi@razomy.com'){
       return decodedClaims;
    }
    throw createError({statusCode: 401, message: 'Unknown user'});
  } catch (error) {
    console.error(error);
    deleteCookie(event, c.cookie.session.token, { domain: c.rootDomain });
    throw createError({statusCode: 401, message: 'Неверный токен'});
  }
}
