import type { Schema, Struct } from '@strapi/strapi';

export interface InformeAcreditacionAcreditacionCompetencias
  extends Struct.ComponentSchema {
  collectionName: 'components_informe_acreditacion_acreditacion_competencias';
  info: {
    description: '';
    displayName: 'acreditacion_competencias';
    icon: 'gate';
  };
  attributes: {
    evaluador: Schema.Attribute.String;
    fecha_evaluacion: Schema.Attribute.Date;
    fecha_evaluacion_practica: Schema.Attribute.Date;
    fecha_evaluacion_teorica: Schema.Attribute.Date;
    observaciones: Schema.Attribute.String;
    operador: Schema.Attribute.Relation<'oneToOne', 'api::operador.operador'>;
    rut_evaluador: Schema.Attribute.String;
    scan_documento: Schema.Attribute.Media<
      'images' | 'files' | 'videos' | 'audios',
      true
    >;
  };
}

export interface InformeAcreditacionHabitosOperacionales
  extends Struct.ComponentSchema {
  collectionName: 'components_informe_acreditacion_habitos_operacionales';
  info: {
    description: '';
    displayName: 'habitos_operacionales';
    icon: 'chartBubble';
  };
  attributes: {
    conclusion_recomendacion: Schema.Attribute.String;
    fecha_acreditacion: Schema.Attribute.Date;
    fecha_vigencia_licencia_interna: Schema.Attribute.Date;
    habitos_operacionales_realizados: Schema.Attribute.Text;
    operador: Schema.Attribute.Relation<'oneToOne', 'api::operador.operador'>;
    resultado: Schema.Attribute.Text;
    situacion_actual: Schema.Attribute.String;
  };
}

export interface InformesBaseInforme extends Struct.ComponentSchema {
  collectionName: 'components_informes_base_informes';
  info: {
    description: '';
    displayName: 'base_informe';
    icon: 'puzzle';
  };
  attributes: {
    auditor: Schema.Attribute.Relation<'oneToMany', 'api::auditor.auditor'>;
    empresa: Schema.Attribute.Relation<'oneToOne', 'api::empresa.empresa'>;
    fecha_informe: Schema.Attribute.Date;
    informe: Schema.Attribute.Relation<'oneToOne', 'api::informe.informe'>;
    nombre_informe: Schema.Attribute.String;
  };
}

export interface InformesRequerimiento extends Struct.ComponentSchema {
  collectionName: 'components_informes_requerimientos';
  info: {
    description: '';
    displayName: 'requerimientos';
    icon: 'pin';
  };
  attributes: {
    archivos: Schema.Attribute.Media<'images' | 'files' | 'videos', true>;
    calificacion: Schema.Attribute.Enumeration<
      ['cumple', 'no cumple', 'oportunidad de mejora', 'no aplica']
    >;
    comentario: Schema.Attribute.Text;
    nombre_requerimiento: Schema.Attribute.Text;
    recomendacion: Schema.Attribute.Text;
  };
}

export interface InformesResumenInforme extends Struct.ComponentSchema {
  collectionName: 'components_informes_resumen_informes';
  info: {
    description: '';
    displayName: 'resumen_informe';
    icon: 'puzzle';
  };
  attributes: {
    calificacion: Schema.Attribute.Enumeration<
      ['conforme', 'no conforme', 'con observaciones', 'no aplica']
    >;
    observaciones: Schema.Attribute.Text;
    requerimiento: Schema.Attribute.Component<'informes.requerimiento', true>;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'informe-acreditacion.acreditacion-competencias': InformeAcreditacionAcreditacionCompetencias;
      'informe-acreditacion.habitos-operacionales': InformeAcreditacionHabitosOperacionales;
      'informes.base-informe': InformesBaseInforme;
      'informes.requerimiento': InformesRequerimiento;
      'informes.resumen-informe': InformesResumenInforme;
    }
  }
}
