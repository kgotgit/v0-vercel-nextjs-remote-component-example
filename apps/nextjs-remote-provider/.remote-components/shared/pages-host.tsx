'use client';
export const shared = { ['react']: () => import('react'),
['react/jsx-dev-runtime']: () => import('react/jsx-dev-runtime'),
['react/jsx-runtime']: () => import('react/jsx-runtime'),
['react-dom']: () => import('react-dom'),
['react-dom/client']: () => import('react-dom/client'),
['next/router']: () => import('next/router'),
['next/link']: () => import('next/link'),
['next/image']: () => import('next/image'),
['next/script']: () => import('next/script'),
['next/form']: () => import('next/form'),};
