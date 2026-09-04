import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBox, faXmark, faClipboard, faTriangleExclamation, faBuilding, faCheckCircle, faPlus, faTrash,
  faFolderOpen, faMoneyBill, faChartBar, faPenToSquare, faFloppyDisk, faCartShopping, faUser, faCheck,
  faDownload, faArrowLeft, faMoneyBillWave, faUsers, faFolder, faCalendar, faChevronDown, faHashtag,
  faScroll, faMagnifyingGlass, faMobile, faLocationDot, faReceipt, faPhone, faWarehouse, faGear,
  faRotate, faGlobe, faBagShopping, faKey, faEye, faHourglassHalf, faExpand, faPumpSoap, faChartLine,
  faEnvelope, faCamera, faUpload, faArrowRight, faPalette, faBolt, faPrint, faLock, faChevronLeft,
  faChevronRight, faUndo, faBan, faCircleDollarSign, faMugHot, faGlassWater, faBowlRice, faBowlFood,
  faDrumstickBite, faAppleWhole, faLeaf, faFish, faBreadSlice, faToothbrush, faPills, faCookie,
  faIceCream, faSmoking, faBook, faPen, faShoePrints, faGamepad, faLaptop, faRuler, faCreditCard,
  faBuildingColumns, faShop, faFileArchive, faCircle, faFileLines, faLightbulb, faUtensils, faTag,
  faThumbtack, faUserTie, faCalendarCheck, faBell, faIdCard
} from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

const MAP: Record<string, IconDefinition> = {
  '📦': faBox, '✕': faXmark, '✖': faXmark, '❌': faXmark, '⚠': faTriangleExclamation, '⚠️': faTriangleExclamation,
  '🏢': faBuilding, '✅': faCheckCircle, '➕': faPlus, '🗑': faTrash, '🗑️': faTrash, '📂': faFolderOpen,
  '💰': faMoneyBill, '📊': faChartBar, '✏': faPenToSquare, '✏️': faPenToSquare, '💾': faFloppyDisk,
  '🛒': faCartShopping, '👤': faUser, '✓': faCheck, '📥': faDownload, '←': faArrowLeft,
  '💵': faMoneyBillWave, '👥': faUsers, '📁': faFolder, '📅': faCalendar, '▼': faChevronDown,
  '🔢': faHashtag, '📜': faScroll, '🔍': faMagnifyingGlass, '📱': faMobile, '📍': faLocationDot,
  '🧾': faReceipt, '📞': faPhone, '🏭': faWarehouse, '⚙': faGear, '⚙️': faGear, '🔄': faRotate,
  '🌐': faGlobe, '👜': faBagShopping, '🔑': faKey, '👁': faEye, '👁️': faEye, '⏳': faHourglassHalf,
  '⛶': faExpand, '🧴': faPumpSoap, '📈': faChartLine, '✉': faEnvelope, '📷': faCamera, '📤': faUpload,
  '→': faArrowRight, '🎨': faPalette, '💥': faBolt, '🖨': faPrint, '🖨️': faPrint, '🔒': faLock,
  '◀': faChevronLeft, '▶': faChevronRight, '↩': faUndo, '🚫': faBan, '☕': faMugHot, '🥤': faGlassWater,
  '🍚': faBowlRice, '🍛': faBowlFood, '🍗': faDrumstickBite, '🍎': faAppleWhole, '🥬': faLeaf,
  '🐟': faFish, '🫓': faBreadSlice, '🧼': faPumpSoap, '🪥': faToothbrush, '💊': faPills, '🍪': faCookie,
  '🍦': faIceCream, '🚬': faSmoking, '📚': faBook, '🖊': faPen, '👟': faShoePrints, '🎮': faGamepad,
  '💻': faLaptop, '📏': faRuler, '💳': faCreditCard, '🏦': faBuildingColumns, '🏪': faShop,
  '📧': faEnvelope, '🗄': faFileArchive, '🟢': faCircle, '🔴': faCircle, '📄': faFileLines,
  '💡': faLightbulb, '🍴': faUtensils, '🏷': faTag, '📌': faThumbtack, '🧑': faUserTie, '🧑‍💼': faUserTie,
  '📆': faCalendarCheck, '🔔': faBell, '🪪': faIdCard
};

export function Icon(props: { e: string; size?: string; fixedWidth?: boolean; className?: string }) {
  const icon = MAP[props.e as keyof typeof MAP] || faBox;
  return <FontAwesomeIcon icon={icon} size={props.size as any || 'sm'} fixedWidth={props.fixedWidth} className={props.className} />;
}
export function iconSpan(e: string): React.ReactNode { return <Icon e={e} />; }
